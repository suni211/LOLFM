const pool = require('../database/pool');

/**
 * 경기 시뮬레이션 서비스
 */
class MatchService {
  // 경기 시뮬레이션
  static async simulateMatch(matchId) {
    const conn = await pool.getConnection();
    try {
      const match = await conn.query(
        `SELECT m.*, l.region_id 
         FROM matches m 
         JOIN leagues l ON m.league_id = l.id 
         WHERE m.id = ?`,
        [matchId]
      );

      if (match.length === 0) throw new Error('경기를 찾을 수 없습니다.');

      const m = match[0];

      // 홈팀 선수들
      const homePlayers = await conn.query(
        `SELECT * FROM players WHERE team_id = ? AND 
         id NOT IN (SELECT player_id FROM player_injuries WHERE status = 'ACTIVE')`,
        [m.home_team_id]
      );

      // 어웨이팀 선수들
      const awayPlayers = await conn.query(
        `SELECT * FROM players WHERE team_id = ? AND 
         id NOT IN (SELECT player_id FROM player_injuries WHERE status = 'ACTIVE')`,
        [m.away_team_id]
      );

      // 팀 전력 계산
      const homePower = this.calculateTeamPower(homePlayers, m.home_team_id, true);
      const awayPower = this.calculateTeamPower(awayPlayers, m.away_team_id, false);

      // 홈 어드밴티지 (5% 보너스)
      const homeAdvantage = m.is_home ? 1.05 : 1.0;

      // 경기 결과 계산
      const result = this.calculateMatchResult(homePower * homeAdvantage, awayPower);

      // 경기장 효과 (관중 수)
      const stadium = await conn.query(
        'SELECT max_capacity FROM stadiums WHERE team_id = ?',
        [m.home_team_id]
      );
      const attendance = stadium.length > 0 ? Math.floor(stadium[0].max_capacity * (0.5 + Math.random() * 0.5)) : 0;

      // 경기 결과 저장
      await conn.query(
        `UPDATE matches 
         SET home_score = ?, away_score = ?, status = 'FINISHED'
         WHERE id = ?`,
        [result.homeScore, result.awayScore, matchId]
      );

      // 순위 업데이트
      await this.updateStandings(m.league_id, m.home_team_id, m.away_team_id, result);

      // 티켓 수입 계산
      const ticketPrice = 50000; // 티켓 가격
      const revenue = attendance * ticketPrice;

      // 홈팀에 수입 지급
      await conn.query(
        'UPDATE teams SET money = money + ? WHERE id = ?',
        [revenue, m.home_team_id]
      );

      // 재정 기록
      await conn.query(
        `INSERT INTO financial_records (team_id, type, category, amount, description, record_date)
         VALUES (?, 'INCOME', 'TICKET_SALES', ?, ?, CURDATE())`,
        [m.home_team_id, revenue, `${attendance}명 관중, 티켓 판매`]
      );

      // 팬 증가/감소
      if (result.homeScore > result.awayScore) {
        await this.updateFans(m.home_team_id, 100);
        await this.updateFans(m.away_team_id, -50);
      } else if (result.awayScore > result.homeScore) {
        await this.updateFans(m.away_team_id, 100);
        await this.updateFans(m.home_team_id, -50);
      }

      // 선수 통계 기록
      await this.recordPlayerStats(homePlayers, matchId, result.homeScore > result.awayScore);
      await this.recordPlayerStats(awayPlayers, matchId, result.awayScore > result.homeScore);

      return {
        homeScore: result.homeScore,
        awayScore: result.awayScore,
        attendance,
        revenue
      };
    } finally {
      conn.release();
    }
  }

  // 팀 전력 계산
  static calculateTeamPower(players, teamId, isHome) {
    if (players.length < 5) return 0; // 최소 5명 필요

    let totalPower = 0;
    players.forEach(player => {
      // 오버롤 기반 전력
      const basePower = player.overall || 50;
      
      // 컨디션 반영
      const conditionFactor = (player.condition || 50) / 100;
      
      // 포지션별 가중치
      const positionWeight = {
        'TOP': 0.9, 'JGL': 1.0, 'MID': 1.1, 'ADC': 1.0, 'SPT': 0.9
      };
      const weight = positionWeight[player.position] || 1.0;

      totalPower += basePower * conditionFactor * weight;
    });

    return totalPower / players.length;
  }

  // 경기 결과 계산
  static calculateMatchResult(homePower, awayPower) {
    const totalPower = homePower + awayPower;
    const homeWinProb = homePower / totalPower;

    // 랜덤 요소 추가
    const randomFactor = (Math.random() - 0.5) * 0.3; // ±15% 변동
    const adjustedProb = Math.max(0.1, Math.min(0.9, homeWinProb + randomFactor));

    const homeWins = Math.random() < adjustedProb;

    // 스코어 계산 (보통 1-0, 2-1, 2-0 등)
    let homeScore, awayScore;
    if (homeWins) {
      homeScore = Math.random() < 0.7 ? 2 : 1;
      awayScore = homeScore === 2 ? (Math.random() < 0.5 ? 0 : 1) : 0;
    } else {
      awayScore = Math.random() < 0.7 ? 2 : 1;
      homeScore = awayScore === 2 ? (Math.random() < 0.5 ? 0 : 1) : 0;
    }

    return { homeScore, awayScore, homeWins };
  }

  // 순위 업데이트
  static async updateStandings(leagueId, homeTeamId, awayTeamId, result) {
    const conn = await pool.getConnection();
    try {
      const gameTime = await conn.query('SELECT `current_year` FROM game_time WHERE id = 1');
      const seasonYear = gameTime[0]?.current_year || 2024;

      // 홈팀 순위
      let homeStanding = await conn.query(
        'SELECT * FROM league_standings WHERE league_id = ? AND team_id = ? AND season_year = ?',
        [leagueId, homeTeamId, seasonYear]
      );

      if (homeStanding.length === 0) {
        await conn.query(
          `INSERT INTO league_standings (league_id, team_id, season_year, wins, losses, points)
           VALUES (?, ?, ?, 0, 0, 0)`,
          [leagueId, homeTeamId, seasonYear]
        );
        homeStanding = await conn.query(
          'SELECT * FROM league_standings WHERE league_id = ? AND team_id = ? AND season_year = ?',
          [leagueId, homeTeamId, seasonYear]
        );
      }

      // 어웨이팀 순위
      let awayStanding = await conn.query(
        'SELECT * FROM league_standings WHERE league_id = ? AND team_id = ? AND season_year = ?',
        [leagueId, awayTeamId, seasonYear]
      );

      if (awayStanding.length === 0) {
        await conn.query(
          `INSERT INTO league_standings (league_id, team_id, season_year, wins, losses, points)
           VALUES (?, ?, ?, 0, 0, 0)`,
          [leagueId, awayTeamId, seasonYear]
        );
        awayStanding = await conn.query(
          'SELECT * FROM league_standings WHERE league_id = ? AND team_id = ? AND season_year = ?',
          [leagueId, awayTeamId, seasonYear]
        );
      }

      // 승패 업데이트
      if (result.homeScore > result.awayScore) {
        await conn.query(
          `UPDATE league_standings 
           SET wins = wins + 1, points = points + 3, goal_difference = goal_difference + ?
           WHERE id = ?`,
          [result.homeScore - result.awayScore, homeStanding[0].id]
        );
        await conn.query(
          `UPDATE league_standings 
           SET losses = losses + 1, goal_difference = goal_difference - ?
           WHERE id = ?`,
          [result.homeScore - result.awayScore, awayStanding[0].id]
        );
      } else if (result.awayScore > result.homeScore) {
        await conn.query(
          `UPDATE league_standings 
           SET wins = wins + 1, points = points + 3, goal_difference = goal_difference + ?
           WHERE id = ?`,
          [result.awayScore - result.homeScore, awayStanding[0].id]
        );
        await conn.query(
          `UPDATE league_standings 
           SET losses = losses + 1, goal_difference = goal_difference - ?
           WHERE id = ?`,
          [result.awayScore - result.homeScore, homeStanding[0].id]
        );
      } else {
        // 무승부
        await conn.query(
          `UPDATE league_standings SET points = points + 1 WHERE id IN (?, ?)`,
          [homeStanding[0].id, awayStanding[0].id]
        );
      }

      // 순위 재계산
      await this.recalculateRankings(leagueId, seasonYear);
    } finally {
      conn.release();
    }
  }

  // 순위 재계산
  static async recalculateRankings(leagueId, seasonYear) {
    const conn = await pool.getConnection();
    try {
      const standings = await conn.query(
        `SELECT * FROM league_standings 
         WHERE league_id = ? AND season_year = ?
         ORDER BY points DESC, goal_difference DESC, wins DESC`,
        [leagueId, seasonYear]
      );

      for (let i = 0; i < standings.length; i++) {
        await conn.query(
          'UPDATE league_standings SET rank = ? WHERE id = ?',
          [i + 1, standings[i].id]
        );
      }
    } finally {
      conn.release();
    }
  }

  // 팬 수 업데이트
  static async updateFans(teamId, change) {
    const conn = await pool.getConnection();
    try {
      await conn.query(
        'UPDATE teams SET fans = GREATEST(0, fans + ?) WHERE id = ?',
        [change, teamId]
      );
    } finally {
      conn.release();
    }
  }

  // 선수 통계 기록
  static async recordPlayerStats(players, matchId, isWin) {
    const conn = await pool.getConnection();
    try {
      const gameTime = await conn.query('SELECT `current_year` FROM game_time WHERE id = 1');
      const seasonYear = gameTime[0]?.current_year || 2024;

      for (const player of players) {
        // 랜덤 통계 생성 (실제로는 경기 시뮬레이션 결과 기반)
        const kills = Math.floor(Math.random() * 10);
        const deaths = Math.floor(Math.random() * 5);
        const assists = Math.floor(Math.random() * 15);
        const cs = Math.floor(150 + Math.random() * 100);
        const gold = Math.floor(10000 + Math.random() * 5000);

        await conn.query(
          `INSERT INTO player_statistics 
           (player_id, match_id, season_year, kills, deaths, assists, cs, gold)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [player.id, matchId, seasonYear, kills, deaths, assists, cs, gold]
        );
      }
    } finally {
      conn.release();
    }
  }
}

module.exports = MatchService;

