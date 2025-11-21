const { pool } = require('../server');
const MatchService = require('./matchService');

/**
 * 월즈 챔피언십 서비스
 */
class WorldChampionshipService {
  // 월즈 진출팀 선정 (각 지역 1부 상위 2팀)
  static async selectWorldsTeams(seasonYear) {
    const conn = await pool.getConnection();
    try {
      const regions = await conn.query('SELECT id FROM regions');
      const worldsTeams = [];

      for (const region of regions) {
        // 각 지역의 1부 리그 찾기
        const league = await conn.query(
          'SELECT id FROM leagues WHERE region_id = ? AND division = 1',
          [region.id]
        );

        if (league.length === 0) continue;

        // 상위 2팀 선정
        const topTeams = await conn.query(
          `SELECT team_id FROM league_standings 
           WHERE league_id = ? AND season_year = ?
           ORDER BY rank ASC LIMIT 2`,
          [league[0].id, seasonYear]
        );

        topTeams.forEach(team => {
          worldsTeams.push(team.team_id);
        });
      }

      return worldsTeams;
    } finally {
      conn.release();
    }
  }

  // 월즈 챔피언십 생성
  static async createWorldChampionship(seasonYear) {
    const conn = await pool.getConnection();
    try {
      const teams = await this.selectWorldsTeams(seasonYear);
      if (teams.length < 8) {
        throw new Error('월즈 진출팀이 부족합니다.');
      }

      // 조별 리그 (8팀을 2조로)
      const groups = [
        teams.slice(0, 4),
        teams.slice(4, 8)
      ];

      // 조별 리그 경기 생성
      for (let g = 0; g < groups.length; g++) {
        const group = groups[g];
        for (let i = 0; i < group.length; i++) {
          for (let j = i + 1; j < group.length; j++) {
            const matchDate = new Date();
            matchDate.setDate(matchDate.getDate() + (g * 6 + i * 2 + j));

            await conn.query(
              `INSERT INTO world_championships 
               (season_year, round, team_id, opponent_team_id, match_date, status)
               VALUES (?, 'GROUP', ?, ?, ?, 'SCHEDULED')`,
              [seasonYear, group[i], group[j], matchDate]
            );
          }
        }
      }

      return { success: true, teams: teams.length };
    } finally {
      conn.release();
    }
  }

  // 월즈 경기 시뮬레이션
  static async simulateWorldsMatch(championshipId) {
    const conn = await pool.getConnection();
    try {
      const match = await conn.query(
        'SELECT * FROM world_championships WHERE id = ?',
        [championshipId]
      );

      if (match.length === 0) throw new Error('경기를 찾을 수 없습니다.');

      const m = match[0];

      // 팀 전력 계산
      const homePower = await this.calculateTeamPower(m.team_id);
      const awayPower = await this.calculateTeamPower(m.opponent_team_id);

      // 경기 결과
      const result = MatchService.calculateMatchResult(homePower, awayPower);

      // 결과 저장
      await conn.query(
        `UPDATE world_championships 
         SET team_score = ?, opponent_score = ?, status = 'FINISHED',
             winner_team_id = ?
         WHERE id = ?`,
        [
          result.homeScore,
          result.awayScore,
          result.homeWins ? m.team_id : m.opponent_team_id,
          championshipId
        ]
      );

      // 보상 지급
      if (m.round === 'FINAL') {
        await this.distributeRewards(m.season_year, result.homeWins ? m.team_id : m.opponent_team_id);
      }

      return result;
    } finally {
      conn.release();
    }
  }

  // 팀 전력 계산
  static async calculateTeamPower(teamId) {
    const conn = await pool.getConnection();
    try {
      const players = await conn.query(
        'SELECT overall FROM players WHERE team_id = ?',
        [teamId]
      );

      if (players.length < 5) return 0;

      const avgOverall = players.reduce((sum, p) => sum + (p.overall || 50), 0) / players.length;
      return avgOverall;
    } finally {
      conn.release();
    }
  }

  // 보상 지급
  static async distributeRewards(seasonYear, winnerTeamId) {
    const conn = await pool.getConnection();
    try {
      // 우승팀 보상
      const winnerReward = {
        cash: 1000000000, // 10억
        awareness: 500,
        fans: 10000
      };

      await conn.query(
        'UPDATE teams SET money = money + ?, awareness = awareness + ?, fans = fans + ? WHERE id = ?',
        [winnerReward.cash, winnerReward.awareness, winnerReward.fans, winnerTeamId]
      );

      await conn.query(
        `INSERT INTO world_championship_rewards 
         (team_id, championship_id, rank, cash_reward, awareness_bonus, fan_bonus, reward_date)
         VALUES (?, (SELECT id FROM world_championships WHERE season_year = ? AND round = 'FINAL' LIMIT 1), 
                 1, ?, ?, ?, CURDATE())`,
        [winnerTeamId, seasonYear, winnerReward.cash, winnerReward.awareness, winnerReward.fans]
      );

      return winnerReward;
    } finally {
      conn.release();
    }
  }
}

module.exports = WorldChampionshipService;

