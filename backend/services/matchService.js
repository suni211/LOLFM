const pool = require('../database/pool');

class MatchService {
  // 경기 시뮬레이션
  static async simulateMatch(match) {
    let conn;
    try {
      conn = await pool.getConnection();
      
      // 홈팀과 원정팀 선수 정보 조회
      const homePlayers = await conn.query(
        'SELECT * FROM players WHERE team_id = ?',
        [match.home_team_id]
      );
      
      const awayPlayers = await conn.query(
        'SELECT * FROM players WHERE team_id = ?',
        [match.away_team_id]
      );
      
      // 팀 전력 계산
      const homeTeamPower = this.calculateTeamPower(homePlayers);
      const awayTeamPower = this.calculateTeamPower(awayPlayers);
      
      // 승률 계산
      const totalPower = homeTeamPower + awayTeamPower;
      const homeWinChance = homeTeamPower / totalPower;
      
      // 경기 결과 결정
      const random = Math.random();
      let homeScore, awayScore;
      
      if (random < homeWinChance) {
        // 홈팀 승리
        homeScore = 2;
        awayScore = Math.random() < 0.7 ? 0 : 1;
      } else {
        // 원정팀 승리
        awayScore = 2;
        homeScore = Math.random() < 0.7 ? 0 : 1;
      }
      
      // 경기 결과 업데이트
      await conn.query(
        `UPDATE matches 
         SET home_score = ?, away_score = ?, status = 'completed', match_date = NOW()
         WHERE id = ?`,
        [homeScore, awayScore, match.id]
      );
      
      // 리그 순위 업데이트
      await this.updateStandings(conn, match.league_id);
      
      return { homeScore, awayScore };
    } catch (error) {
      console.error('경기 시뮬레이션 오류:', error);
      throw error;
    } finally {
      if (conn) conn.release();
    }
  }
  
  // 팀 전력 계산
  static calculateTeamPower(players) {
    let totalPower = 0;
    
    for (const player of players) {
      const playerPower = 
        player.overall * 0.3 +
        player.teamfight * 0.2 +
        player.laning * 0.2 +
        player.cs_skill * 0.15 +
        player.mental * 0.1 +
        (player.condition / 100) * 0.05;
      
      totalPower += playerPower;
    }
    
    return totalPower;
  }
  
  // 리그 순위 업데이트
  static async updateStandings(conn, leagueId) {
    // 해당 리그의 모든 팀 조회
    const teams = await conn.query(
      'SELECT DISTINCT home_team_id as team_id FROM matches WHERE league_id = ? UNION SELECT DISTINCT away_team_id FROM matches WHERE league_id = ?',
      [leagueId, leagueId]
    );
    
    for (const team of teams) {
      // 팀의 경기 결과 집계
      const homeMatches = await conn.query(
        `SELECT * FROM matches 
         WHERE home_team_id = ? AND league_id = ? AND status = 'completed'`,
        [team.team_id, leagueId]
      );
      
      const awayMatches = await conn.query(
        `SELECT * FROM matches 
         WHERE away_team_id = ? AND league_id = ? AND status = 'completed'`,
        [team.team_id, leagueId]
      );
      
      let wins = 0, draws = 0, losses = 0, points = 0;
      
      // 홈 경기 집계
      for (const match of homeMatches) {
        if (match.home_score > match.away_score) {
          wins++;
          points += 3;
        } else if (match.home_score === match.away_score) {
          draws++;
          points += 1;
        } else {
          losses++;
        }
      }
      
      // 원정 경기 집계
      for (const match of awayMatches) {
        if (match.away_score > match.home_score) {
          wins++;
          points += 3;
        } else if (match.away_score === match.home_score) {
          draws++;
          points += 1;
        } else {
          losses++;
        }
      }
      
      // league_standings 업데이트
      await conn.query(
        `INSERT INTO league_standings (league_id, team_id, wins, draws, losses, points)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE 
         wins = ?, draws = ?, losses = ?, points = ?`,
        [leagueId, team.team_id, wins, draws, losses, points, wins, draws, losses, points]
      );
    }
  }
  
  // 리그 스케줄 생성
  static async generateLeagueSchedule(leagueId) {
    let conn;
    try {
      conn = await pool.getConnection();
      
      // 리그의 팀 조회
      const teams = await conn.query(
        'SELECT id FROM teams WHERE league_id = ? ORDER BY id',
        [leagueId]
      );
      
      if (teams.length < 2) {
        throw new Error('리그에 최소 2팀이 필요합니다.');
      }
      
      // 현재 게임 시간 조회
      const [gameTime] = await conn.query(
        'SELECT * FROM game_time LIMIT 1'
      );
      
      let matchDate = new Date(gameTime.current_year, gameTime.current_month - 1, 1);
      
      // 홈 앤 어웨이 방식으로 모든 팀 간 경기 생성
      for (let i = 0; i < teams.length; i++) {
        for (let j = i + 1; j < teams.length; j++) {
          // 홈 경기
          await conn.query(
            `INSERT INTO matches (league_id, home_team_id, away_team_id, scheduled_date, status)
             VALUES (?, ?, ?, ?, 'scheduled')`,
            [leagueId, teams[i].id, teams[j].id, matchDate]
          );
          
          matchDate.setDate(matchDate.getDate() + 7); // 일주일 간격
          
          // 원정 경기
          await conn.query(
            `INSERT INTO matches (league_id, home_team_id, away_team_id, scheduled_date, status)
             VALUES (?, ?, ?, ?, 'scheduled')`,
            [leagueId, teams[j].id, teams[i].id, matchDate]
          );
          
          matchDate.setDate(matchDate.getDate() + 7);
        }
      }
      
      console.log(`리그 ${leagueId} 스케줄 생성 완료`);
    } catch (error) {
      console.error('스케줄 생성 오류:', error);
      throw error;
    } finally {
      if (conn) conn.release();
    }
  }
}

module.exports = MatchService;
