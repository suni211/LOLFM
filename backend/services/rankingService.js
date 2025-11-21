const pool = require('../database/pool');

/**
 * 랭킹 서비스
 */
class RankingService {
  // 랭킹 업데이트
  static async updateRankings() {
    const conn = await pool.getConnection();
    try {
      // 자금 랭킹
      await this.updateMoneyRanking(conn);
      
      // 팬 수 랭킹
      await this.updateFanRanking(conn);
      
      // 인지도 랭킹
      await this.updateAwarenessRanking(conn);
      
      // 월즈 우승 횟수 랭킹
      await this.updateWorldChampionshipRanking(conn);
    } finally {
      conn.release();
    }
  }

  static async updateMoneyRanking(conn) {
    const teams = await conn.query(
      'SELECT id, money FROM teams WHERE is_game_over = FALSE ORDER BY money DESC'
    );

    for (let i = 0; i < teams.length; i++) {
      await conn.query(
        `INSERT INTO rankings (team_id, ranking_type, rank, value)
         VALUES (?, 'MONEY', ?, ?)
         ON DUPLICATE KEY UPDATE rank = ?, value = ?`,
        [teams[i].id, i + 1, teams[i].money, i + 1, teams[i].money]
      );
    }
  }

  static async updateFanRanking(conn) {
    const teams = await conn.query(
      'SELECT id, fans FROM teams WHERE is_game_over = FALSE ORDER BY fans DESC'
    );

    for (let i = 0; i < teams.length; i++) {
      await conn.query(
        `INSERT INTO rankings (team_id, ranking_type, rank, value)
         VALUES (?, 'FANS', ?, ?)
         ON DUPLICATE KEY UPDATE rank = ?, value = ?`,
        [teams[i].id, i + 1, teams[i].fans, i + 1, teams[i].fans]
      );
    }
  }

  static async updateAwarenessRanking(conn) {
    const teams = await conn.query(
      'SELECT id, awareness FROM teams WHERE is_game_over = FALSE ORDER BY awareness DESC'
    );

    for (let i = 0; i < teams.length; i++) {
      await conn.query(
        `INSERT INTO rankings (team_id, ranking_type, rank, value)
         VALUES (?, 'AWARENESS', ?, ?)
         ON DUPLICATE KEY UPDATE rank = ?, value = ?`,
        [teams[i].id, i + 1, teams[i].awareness, i + 1, teams[i].awareness]
      );
    }
  }

  static async updateWorldChampionshipRanking(conn) {
    const teams = await conn.query(
      `SELECT t.id, COUNT(wcr.id) as wins
       FROM teams t
       LEFT JOIN world_championship_rewards wcr ON t.id = wcr.team_id AND wcr.rank = 1
       WHERE t.is_game_over = FALSE
       GROUP BY t.id
       ORDER BY wins DESC`
    );

    for (let i = 0; i < teams.length; i++) {
      await conn.query(
        `INSERT INTO rankings (team_id, ranking_type, rank, value)
         VALUES (?, 'WORLD_CHAMPIONSHIPS', ?, ?)
         ON DUPLICATE KEY UPDATE rank = ?, value = ?`,
        [teams[i].id, i + 1, teams[i].wins, i + 1, teams[i].wins]
      );
    }
  }

  // 랭킹 조회
  static async getRankings(type, limit = 10) {
    const conn = await pool.getConnection();
    try {
      const rankings = await conn.query(
        `SELECT r.*, t.name as team_name
         FROM rankings r
         JOIN teams t ON r.team_id = t.id
         WHERE r.ranking_type = ?
         ORDER BY r.rank ASC
         LIMIT ?`,
        [type, limit]
      );
      return rankings;
    } finally {
      conn.release();
    }
  }
}

module.exports = RankingService;

