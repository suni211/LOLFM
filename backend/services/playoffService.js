const pool = require('../database/pool');
const MatchService = require('./matchService');

/**
 * 플레이오프 서비스
 */
class PlayoffService {
  // 플레이오프 생성 (정규시즌 상위 4팀)
  static async createPlayoffs(leagueId, seasonYear) {
    const conn = await pool.getConnection();
    try {
      // 상위 4팀 선정
      const topTeams = await conn.query(
        `SELECT team_id FROM league_standings 
         WHERE league_id = ? AND season_year = ?
         ORDER BY rank ASC LIMIT 4`,
        [leagueId, seasonYear]
      );

      if (topTeams.length < 4) {
        throw new Error('플레이오프 진출팀이 부족합니다.');
      }

      // 4강전 생성
      const semifinal1 = {
        home: topTeams[0].team_id,
        away: topTeams[3].team_id
      };
      const semifinal2 = {
        home: topTeams[1].team_id,
        away: topTeams[2].team_id
      };

      const matchDate = new Date();
      matchDate.setDate(matchDate.getDate() + 7);

      // 4강전 1
      const sf1 = await conn.query(
        `INSERT INTO playoffs 
         (league_id, season_year, round, home_team_id, away_team_id, match_date, status)
         VALUES (?, ?, 'SEMIFINAL', ?, ?, ?, 'SCHEDULED')`,
        [leagueId, seasonYear, semifinal1.home, semifinal1.away, matchDate]
      );

      // 4강전 2
      const sf2 = await conn.query(
        `INSERT INTO playoffs 
         (league_id, season_year, round, home_team_id, away_team_id, match_date, status)
         VALUES (?, ?, 'SEMIFINAL', ?, ?, ?, 'SCHEDULED')`,
        [leagueId, seasonYear, semifinal2.home, semifinal2.away, new Date(matchDate.getTime() + 24 * 60 * 60 * 1000)]
      );

      return { success: true, semifinals: [sf1.insertId, sf2.insertId] };
    } finally {
      conn.release();
    }
  }

  // 플레이오프 경기 시뮬레이션
  static async simulatePlayoffMatch(playoffId) {
    const conn = await pool.getConnection();
    try {
      const playoff = await conn.query(
        'SELECT * FROM playoffs WHERE id = ?',
        [playoffId]
      );

      if (playoff.length === 0) throw new Error('경기를 찾을 수 없습니다.');

      const p = playoff[0];

      // 팀 전력 계산
      const homePower = await MatchService.calculateTeamPower(
        await conn.query('SELECT * FROM players WHERE team_id = ?', [p.home_team_id]),
        p.home_team_id,
        true
      );
      const awayPower = await MatchService.calculateTeamPower(
        await conn.query('SELECT * FROM players WHERE team_id = ?', [p.away_team_id]),
        p.away_team_id,
        false
      );

      // 경기 결과
      const result = MatchService.calculateMatchResult(homePower, awayPower);
      const winnerId = result.homeWins ? p.home_team_id : p.away_team_id;

      // 결과 저장
      await conn.query(
        `UPDATE playoffs 
         SET home_score = ?, away_score = ?, status = 'FINISHED', winner_team_id = ?
         WHERE id = ?`,
        [result.homeScore, result.awayScore, winnerId, playoffId]
      );

      // 결승전 생성 (필요시)
      if (p.round === 'SEMIFINAL') {
        await this.createFinalIfReady(p.league_id, p.season_year, winnerId);
      }

      return result;
    } finally {
      conn.release();
    }
  }

  // 결승전 생성
  static async createFinalIfReady(leagueId, seasonYear, semifinalWinnerId) {
    const conn = await pool.getConnection();
    try {
      // 다른 4강전 결과 확인
      const otherSemifinal = await conn.query(
        `SELECT winner_team_id FROM playoffs 
         WHERE league_id = ? AND season_year = ? AND round = 'SEMIFINAL' 
         AND id != (SELECT id FROM playoffs WHERE winner_team_id = ? LIMIT 1)
         AND status = 'FINISHED'`,
        [leagueId, seasonYear, semifinalWinnerId]
      );

      if (otherSemifinal.length > 0) {
        const finalDate = new Date();
        finalDate.setDate(finalDate.getDate() + 7);

        await conn.query(
          `INSERT INTO playoffs 
           (league_id, season_year, round, home_team_id, away_team_id, match_date, status)
           VALUES (?, ?, 'FINAL', ?, ?, ?, 'SCHEDULED')`,
          [leagueId, seasonYear, semifinalWinnerId, otherSemifinal[0].winner_team_id, finalDate]
        );
      }
    } finally {
      conn.release();
    }
  }
}

module.exports = PlayoffService;

