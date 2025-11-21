const pool = require('../database/pool');
const MatchService = require('./matchService');

class FriendlyMatchService {
  // 친선 경기 생성
  static async createFriendlyMatch(team1Id, team2Id, matchDate) {
    let conn;
    try {
      conn = await pool.getConnection();
      await conn.beginTransaction();
      
      // 두 팀 정보 확인
      const [team1] = await conn.query('SELECT * FROM teams WHERE id = ?', [team1Id]);
      const [team2] = await conn.query('SELECT * FROM teams WHERE id = ?', [team2Id]);
      
      if (!team1 || team1.length === 0 || !team2 || team2.length === 0) {
        throw new Error('팀을 찾을 수 없습니다.');
      }
      
      if (team1Id === team2Id) {
        throw new Error('같은 팀끼리는 친선 경기를 할 수 없습니다.');
      }
      
      // 선수 수 확인
      const team1Players = await conn.query('SELECT COUNT(*) as count FROM players WHERE team_id = ?', [team1Id]);
      const team2Players = await conn.query('SELECT COUNT(*) as count FROM players WHERE team_id = ?', [team2Id]);
      
      if (team1Players[0].count < 5 || team2Players[0].count < 5) {
        throw new Error('팀에 선수가 부족합니다. (최소 5명 필요)');
      }
      
      // 친선 경기 생성 (league_id는 NULL, is_friendly는 TRUE)
      const result = await conn.query(
        `INSERT INTO matches (
          league_id, home_team_id, away_team_id, match_date, 
          is_friendly, status
        ) VALUES (NULL, ?, ?, ?, TRUE, 'scheduled')`,
        [team1Id, team2Id, matchDate]
      );
      
      await conn.commit();
      
      return {
        matchId: result.insertId,
        message: '친선 경기가 생성되었습니다.',
        team1: team1[0].name,
        team2: team2[0].name,
        matchDate
      };
    } catch (error) {
      await conn.rollback();
      console.error('친선 경기 생성 오류:', error);
      throw error;
    } finally {
      if (conn) conn.release();
    }
  }
  
  // 친선 경기 시뮬레이션 (리그 순위에 영향 없음)
  static async simulateFriendlyMatch(matchId) {
    let conn;
    try {
      conn = await pool.getConnection();
      await conn.beginTransaction();
      
      // 경기 정보 조회
      const [matches] = await conn.query(
        'SELECT * FROM matches WHERE id = ? AND is_friendly = TRUE',
        [matchId]
      );
      
      if (!matches || matches.length === 0) {
        throw new Error('친선 경기를 찾을 수 없습니다.');
      }
      
      const match = matches[0];
      
      if (match.status === 'completed') {
        return {
          homeScore: match.home_score,
          awayScore: match.away_score,
          status: 'completed',
          message: '이미 완료된 경기입니다.'
        };
      }
      
      // 홈팀과 원정팀 선수 정보 조회
      const homePlayers = await conn.query(
        'SELECT * FROM players WHERE team_id = ?',
        [match.home_team_id]
      );
      
      const awayPlayers = await conn.query(
        'SELECT * FROM players WHERE team_id = ?',
        [match.away_team_id]
      );
      
      if (homePlayers.length < 5 || awayPlayers.length < 5) {
        throw new Error('팀에 선수가 부족합니다.');
      }
      
      // 팀 전력 계산
      const homeTeamPower = MatchService.calculateTeamPower(homePlayers);
      const awayTeamPower = MatchService.calculateTeamPower(awayPlayers);
      
      // 홈 어드밴티지 추가 (10%)
      const homeAdvantage = 1.1;
      const adjustedHomePower = homeTeamPower * homeAdvantage;
      
      // 승률 계산
      const totalPower = adjustedHomePower + awayTeamPower;
      const homeWinChance = adjustedHomePower / totalPower;
      
      // 경기 결과 결정 (BO3 방식)
      const random = Math.random();
      let homeScore = 0, awayScore = 0;
      
      // 3게임 시뮬레이션
      for (let game = 0; game < 3; game++) {
        const gameRandom = Math.random();
        if (gameRandom < homeWinChance) {
          homeScore++;
          if (homeScore === 2) break; // 2승하면 종료
        } else {
          awayScore++;
          if (awayScore === 2) break; // 2승하면 종료
        }
      }
      
      // 경기 결과 업데이트 (리그 순위는 업데이트하지 않음)
      await conn.query(
        `UPDATE matches 
         SET home_score = ?, away_score = ?, status = 'completed', 
             match_date = NOW(), completed_at = NOW()
         WHERE id = ?`,
        [homeScore, awayScore, matchId]
      );
      
      // 팀 통계는 업데이트 (팬, 명성 등)
      await MatchService.updateTeamStats(conn, match.home_team_id, homeScore > awayScore, homeScore === awayScore);
      await MatchService.updateTeamStats(conn, match.away_team_id, awayScore > homeScore, homeScore === awayScore);
      
      await conn.commit();
      
      return {
        homeScore,
        awayScore,
        homeTeamPower: Math.round(homeTeamPower),
        awayTeamPower: Math.round(awayTeamPower),
        status: 'completed',
        message: homeScore > awayScore ? '홈팀 승리' : awayScore > homeScore ? '원정팀 승리' : '무승부',
        isFriendly: true
      };
    } catch (error) {
      await conn.rollback();
      console.error('친선 경기 시뮬레이션 오류:', error);
      throw error;
    } finally {
      if (conn) conn.release();
    }
  }
  
  // 친선 경기 가능한 팀 목록 조회 (다른 리그의 팀들)
  static async getAvailableOpponents(teamId) {
    let conn;
    try {
      conn = await pool.getConnection();
      
      // 현재 팀 정보 조회
      const [team] = await conn.query('SELECT * FROM teams WHERE id = ?', [teamId]);
      if (!team || team.length === 0) {
        throw new Error('팀을 찾을 수 없습니다.');
      }
      
      // 다른 모든 팀 조회 (자기 자신 제외)
      const opponents = await conn.query(
        `SELECT t.id, t.name, t.abbreviation, t.logo_path, 
         l.name as league_name, r.name as region_name,
         COUNT(p.id) as player_count
         FROM teams t
         LEFT JOIN leagues l ON t.league_id = l.id
         LEFT JOIN regions r ON t.region_id = r.id
         LEFT JOIN players p ON t.id = p.team_id
         WHERE t.id != ?
         GROUP BY t.id, t.name, t.abbreviation, t.logo_path, l.name, r.name
         HAVING player_count >= 5
         ORDER BY t.name ASC
         LIMIT 50`,
        [teamId]
      );
      
      return opponents;
    } catch (error) {
      console.error('상대팀 조회 오류:', error);
      throw error;
    } finally {
      if (conn) conn.release();
    }
  }
  
  // 팀의 친선 경기 목록 조회
  static async getTeamFriendlyMatches(teamId, limit = 10) {
    let conn;
    try {
      conn = await pool.getConnection();
      
      const matches = await conn.query(
        `SELECT m.*, 
         ht.name as home_team_name, ht.logo_path as home_team_logo,
         at.name as away_team_name, at.logo_path as away_team_logo
         FROM matches m
         JOIN teams ht ON m.home_team_id = ht.id
         JOIN teams at ON m.away_team_id = at.id
         WHERE (m.home_team_id = ? OR m.away_team_id = ?)
         AND m.is_friendly = TRUE
         ORDER BY m.match_date DESC
         LIMIT ?`,
        [teamId, teamId, limit]
      );
      
      return matches;
    } catch (error) {
      console.error('친선 경기 목록 조회 오류:', error);
      return [];
    } finally {
      if (conn) conn.release();
    }
  }
}

module.exports = FriendlyMatchService;

