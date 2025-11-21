const pool = require('../database/pool');

class SatisfactionService {
  // 선수 만족도 계산
  static async calculateSatisfaction(playerId) {
    let conn;
    try {
      conn = await pool.getConnection();
      
      const [player] = await conn.query('SELECT * FROM players WHERE id = ?', [playerId]);
      const [team] = await conn.query('SELECT * FROM teams WHERE id = ?', [player.team_id]);
      
      if (!player || !team) return 50;
      
      let satisfaction = 50; // 기본값
      
      // 급여에 따른 만족도 (급여가 높을수록 만족도 증가)
      const salaryRatio = player.salary / (player.overall * 100000);
      satisfaction += (salaryRatio - 1) * 20;
      
      // 팀 성적에 따른 만족도
      const [teamStats] = await conn.query(
        `SELECT 
          SUM(CASE WHEN (home_team_id = ? AND home_score > away_score) OR 
                        (away_team_id = ? AND away_score > home_score) THEN 1 ELSE 0 END) as wins,
          COUNT(*) as total
         FROM matches
         WHERE (home_team_id = ? OR away_team_id = ?) AND status = 'completed'`,
        [team.id, team.id, team.id, team.id]
      );
      
      const winRate = teamStats.total > 0 ? (teamStats.wins / teamStats.total) * 100 : 0;
      satisfaction += (winRate - 50) * 0.3;
      
      // 팀 명성에 따른 만족도
      satisfaction += team.reputation * 0.1;
      
      // 컨디션에 따른 만족도
      satisfaction += (player.condition - 50) * 0.2;
      
      return Math.max(0, Math.min(100, Math.round(satisfaction)));
    } catch (error) {
      console.error('만족도 계산 오류:', error);
      return 50;
    } finally {
      if (conn) conn.release();
    }
  }
  
  // 만족도 업데이트
  static async updateSatisfaction(playerId) {
    let conn;
    try {
      conn = await pool.getConnection();
      
      const satisfaction = await this.calculateSatisfaction(playerId);
      
      await conn.query(
        `INSERT INTO player_satisfaction (player_id, satisfaction_score, updated_at)
         VALUES (?, ?, NOW())
         ON DUPLICATE KEY UPDATE satisfaction_score = ?, updated_at = NOW()`,
        [playerId, satisfaction, satisfaction]
      );
      
      return satisfaction;
    } catch (error) {
      console.error('만족도 업데이트 오류:', error);
      return 50;
    } finally {
      if (conn) conn.release();
    }
  }
}

module.exports = SatisfactionService;

