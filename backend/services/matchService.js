const pool = require('../database/pool');

class MatchService {
  // 경기 시뮬레이션 (matchId로)
  static async simulateMatch(matchId) {
    let conn;
    try {
      conn = await pool.getConnection();
      await conn.beginTransaction();
      
      // 경기 정보 조회
      const [matches] = await conn.query(
        'SELECT * FROM matches WHERE id = ?',
        [matchId]
      );
      
      if (!matches || matches.length === 0) {
        throw new Error('경기를 찾을 수 없습니다.');
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
      const homeTeamPower = this.calculateTeamPower(homePlayers);
      const awayTeamPower = this.calculateTeamPower(awayPlayers);
      
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
      
      // 경기 결과 업데이트
      await conn.query(
        `UPDATE matches 
         SET home_score = ?, away_score = ?, status = 'completed', 
             match_date = NOW(), completed_at = NOW()
         WHERE id = ?`,
        [homeScore, awayScore, matchId]
      );
      
      // 리그 순위 업데이트
      if (match.league_id) {
        await this.updateStandings(conn, match.league_id, match.home_team_id, match.away_team_id, homeScore, awayScore);
      }
      
      // 팀 통계 업데이트
      await this.updateTeamStats(conn, match.home_team_id, homeScore > awayScore, homeScore === awayScore);
      await this.updateTeamStats(conn, match.away_team_id, awayScore > homeScore, homeScore === awayScore);
      
      // 경기 결과 알림
      const NotificationService = require('./notificationService');
      const [homeTeam] = await conn.query('SELECT name FROM teams WHERE id = ?', [match.home_team_id]);
      const [awayTeam] = await conn.query('SELECT name FROM teams WHERE id = ?', [match.away_team_id]);
      
      await NotificationService.createMatchResultNotification(
        match.home_team_id,
        homeScore > awayScore,
        awayTeam.name,
        `${homeScore}-${awayScore}`
      );
      await NotificationService.createMatchResultNotification(
        match.away_team_id,
        awayScore > homeScore,
        homeTeam.name,
        `${awayScore}-${homeScore}`
      );
      
      await conn.commit();
      
      return {
        homeScore,
        awayScore,
        homeTeamPower: Math.round(homeTeamPower),
        awayTeamPower: Math.round(awayTeamPower),
        status: 'completed',
        message: homeScore > awayScore ? '홈팀 승리' : awayScore > homeScore ? '원정팀 승리' : '무승부'
      };
    } catch (error) {
      await conn.rollback();
      console.error('경기 시뮬레이션 오류:', error);
      throw error;
    } finally {
      if (conn) conn.release();
    }
  }
  
  // 팀 전력 계산 (더 정확한 알고리즘)
  static calculateTeamPower(players) {
    if (!players || players.length === 0) return 0;
    
    let totalPower = 0;
    const positionWeights = {
      'TOP': 0.15,
      'JGL': 0.20,
      'MID': 0.25,
      'ADC': 0.20,
      'SPT': 0.20
    };
    
    for (const player of players) {
      const positionWeight = positionWeights[player.position] || 0.2;
      
      // 포지션별 중요 스탯 가중치
      let playerPower = 0;
      
      if (player.position === 'JGL') {
        playerPower = 
          player.overall * 0.25 +
          player.jungling * 0.30 +
          player.teamfight * 0.20 +
          player.mental * 0.15 +
          player.leadership * 0.10;
      } else if (player.position === 'SPT') {
        playerPower = 
          player.overall * 0.20 +
          player.teamfight * 0.25 +
          player.mental * 0.20 +
          player.leadership * 0.20 +
          player.laning * 0.15;
      } else {
        playerPower = 
          player.overall * 0.25 +
          player.laning * 0.25 +
          player.teamfight * 0.20 +
          player.cs_skill * 0.15 +
          player.mental * 0.10 +
          player.leadership * 0.05;
      }
      
      // 컨디션 반영
      const conditionMultiplier = player.condition / 100;
      playerPower *= conditionMultiplier;
      
      totalPower += playerPower * positionWeight;
    }
    
    return totalPower;
  }
  
  // 리그 순위 업데이트
  static async updateStandings(conn, leagueId, homeTeamId, awayTeamId, homeScore, awayScore) {
    try {
      // 게임 시간 조회
      const [gameTime] = await conn.query('SELECT * FROM game_time WHERE id = 1');
      const seasonYear = gameTime.current_year;
      
      // 홈팀 순위 업데이트
      const homeWins = homeScore > awayScore ? 1 : 0;
      const homeDraws = homeScore === awayScore ? 1 : 0;
      const homeLosses = homeScore < awayScore ? 1 : 0;
      const homePoints = homeWins * 3 + homeDraws * 1;
      const homeGoalDiff = homeScore - awayScore;
      
      // goals_for 컬럼이 있는지 확인하고 쿼리 실행
      try {
        await conn.query(
          `INSERT INTO league_standings (
            league_id, team_id, season_year, wins, losses, draws, 
            points, goals_for, goals_against, goal_difference
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            wins = wins + ?,
            losses = losses + ?,
            draws = draws + ?,
            points = points + ?,
            goals_for = goals_for + ?,
            goals_against = goals_against + ?,
            goal_difference = goal_difference + ?`,
          [
            leagueId, homeTeamId, seasonYear, homeWins, homeLosses, homeDraws,
            homePoints, homeScore, awayScore, homeGoalDiff,
            homeWins, homeLosses, homeDraws, homePoints, homeScore, awayScore, homeGoalDiff
          ]
        );
      } catch (error) {
        // goals_for 컬럼이 없으면 기본 컬럼만 사용
        if (error.code === 'ER_BAD_FIELD_ERROR') {
          await conn.query(
            `INSERT INTO league_standings (
              league_id, team_id, season_year, wins, losses, draws, 
              points, goal_difference
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
              wins = wins + ?,
              losses = losses + ?,
              draws = draws + ?,
              points = points + ?,
              goal_difference = goal_difference + ?`,
            [
              leagueId, homeTeamId, seasonYear, homeWins, homeLosses, homeDraws,
              homePoints, homeGoalDiff,
              homeWins, homeLosses, homeDraws, homePoints, homeGoalDiff
            ]
          );
        } else {
          throw error;
        }
      }
      
      // 원정팀 순위 업데이트
      const awayWins = awayScore > homeScore ? 1 : 0;
      const awayDraws = homeScore === awayScore ? 1 : 0;
      const awayLosses = awayScore < homeScore ? 1 : 0;
      const awayPoints = awayWins * 3 + awayDraws * 1;
      const awayGoalDiff = awayScore - homeScore;
      
      // goals_for 컬럼이 있는지 확인하고 쿼리 실행
      try {
        await conn.query(
          `INSERT INTO league_standings (
            league_id, team_id, season_year, wins, losses, draws, 
            points, goals_for, goals_against, goal_difference
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            wins = wins + ?,
            losses = losses + ?,
            draws = draws + ?,
            points = points + ?,
            goals_for = goals_for + ?,
            goals_against = goals_against + ?,
            goal_difference = goal_difference + ?`,
          [
            leagueId, awayTeamId, seasonYear, awayWins, awayLosses, awayDraws,
            awayPoints, awayScore, homeScore, awayGoalDiff,
            awayWins, awayLosses, awayDraws, awayPoints, awayScore, homeScore, awayGoalDiff
          ]
        );
      } catch (error) {
        // goals_for 컬럼이 없으면 기본 컬럼만 사용
        if (error.code === 'ER_BAD_FIELD_ERROR') {
          await conn.query(
            `INSERT INTO league_standings (
              league_id, team_id, season_year, wins, losses, draws, 
              points, goal_difference
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
              wins = wins + ?,
              losses = losses + ?,
              draws = draws + ?,
              points = points + ?,
              goal_difference = goal_difference + ?`,
            [
              leagueId, awayTeamId, seasonYear, awayWins, awayLosses, awayDraws,
              awayPoints, awayGoalDiff,
              awayWins, awayLosses, awayDraws, awayPoints, awayGoalDiff
            ]
          );
        } else {
          throw error;
        }
      }
      
      // 순위 재계산
      await this.recalculateRanks(conn, leagueId, seasonYear);
    } catch (error) {
      console.error('순위 업데이트 오류:', error);
      throw error;
    }
  }
  
  // 순위 재계산
  static async recalculateRanks(conn, leagueId, seasonYear) {
    try {
      // 모든 팀의 순위 데이터 조회
      let standings;
      try {
        standings = await conn.query(
          `SELECT * FROM league_standings 
           WHERE league_id = ? AND season_year = ?
           ORDER BY points DESC, goal_difference DESC, COALESCE(goals_for, 0) DESC`,
          [leagueId, seasonYear]
        );
      } catch (error) {
        // goals_for 컬럼이 없으면 기본 정렬만 사용
        if (error.code === 'ER_BAD_FIELD_ERROR') {
          standings = await conn.query(
            `SELECT * FROM league_standings 
             WHERE league_id = ? AND season_year = ?
             ORDER BY points DESC, goal_difference DESC`,
            [leagueId, seasonYear]
          );
        } else {
          throw error;
        }
      }
      
      // 순위 업데이트
      for (let i = 0; i < standings.length; i++) {
        await conn.query(
          'UPDATE league_standings SET `rank` = ? WHERE id = ?',
          [i + 1, standings[i].id]
        );
      }
    } catch (error) {
      console.error('순위 재계산 오류:', error);
      throw error;
    }
  }
  
  // 팀 통계 업데이트
  static async updateTeamStats(conn, teamId, isWin, isDraw) {
    try {
      if (isWin) {
        await conn.query(
          'UPDATE teams SET reputation = reputation + 5, fans = fans + 1000 WHERE id = ?',
          [teamId]
        );
      } else if (isDraw) {
        await conn.query(
          'UPDATE teams SET reputation = reputation + 2, fans = fans + 500 WHERE id = ?',
          [teamId]
        );
      } else {
        await conn.query(
          'UPDATE teams SET fans = GREATEST(fans - 200, 0) WHERE id = ?',
          [teamId]
        );
      }
    } catch (error) {
      console.error('팀 통계 업데이트 오류:', error);
    }
  }
  
  // 오늘의 경기 조회
  static async getTodayMatches() {
    let conn;
    try {
      conn = await pool.getConnection();
      const [gameTime] = await conn.query('SELECT * FROM game_time WHERE id = 1');
      
      const matches = await conn.query(
        `SELECT m.*, 
         ht.name as home_team_name, ht.logo_path as home_team_logo,
         at.name as away_team_name, at.logo_path as away_team_logo,
         l.name as league_name
         FROM matches m
         JOIN teams ht ON m.home_team_id = ht.id
         JOIN teams at ON m.away_team_id = at.id
         LEFT JOIN leagues l ON m.league_id = l.id
         WHERE DATE(m.match_date) = DATE(?) 
         AND m.status = 'scheduled'
         ORDER BY m.match_date ASC`,
        [`${gameTime.current_year}-${String(gameTime.current_month).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`]
      );
      
      return matches;
    } catch (error) {
      console.error('오늘의 경기 조회 오류:', error);
      return [];
    } finally {
      if (conn) conn.release();
    }
  }
  
  // 팀의 경기 일정 조회
  static async getTeamMatches(teamId, limit = 10) {
    let conn;
    try {
      conn = await pool.getConnection();
      
      const matches = await conn.query(
        `SELECT m.*, 
         ht.name as home_team_name, ht.logo_path as home_team_logo,
         at.name as away_team_name, at.logo_path as away_team_logo,
         l.name as league_name
         FROM matches m
         JOIN teams ht ON m.home_team_id = ht.id
         JOIN teams at ON m.away_team_id = at.id
         LEFT JOIN leagues l ON m.league_id = l.id
         WHERE (m.home_team_id = ? OR m.away_team_id = ?)
         ORDER BY m.match_date DESC
         LIMIT ?`,
        [teamId, teamId, limit]
      );
      
      return matches;
    } catch (error) {
      console.error('팀 경기 조회 오류:', error);
      return [];
    } finally {
      if (conn) conn.release();
    }
  }
}

module.exports = MatchService;
