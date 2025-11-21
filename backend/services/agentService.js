const pool = require('../database/pool');

class AgentService {
  // 에이전트 생성
  static async createAgent(name, negotiationSkill, commissionRate) {
    let conn;
    try {
      conn = await pool.getConnection();
      
      const result = await conn.query(
        `INSERT INTO agents (name, negotiation_skill, commission_rate, status)
         VALUES (?, ?, ?, 'AVAILABLE')`,
        [name, negotiationSkill, commissionRate]
      );
      
      return result.insertId;
    } catch (error) {
      console.error('에이전트 생성 오류:', error);
      throw error;
    } finally {
      if (conn) conn.release();
    }
  }
  
  // 선수에게 에이전트 배정
  static async assignAgentToPlayer(playerId, agentId) {
    let conn;
    try {
      conn = await pool.getConnection();
      
      await conn.query(
        'UPDATE players SET agent_id = ? WHERE id = ?',
        [agentId, playerId]
      );
      
      return true;
    } catch (error) {
      console.error('에이전트 배정 오류:', error);
      throw error;
    } finally {
      if (conn) conn.release();
    }
  }
  
  // 협상 시 에이전트 효과 적용
  static async applyAgentEffect(agentId, baseSalary) {
    let conn;
    try {
      conn = await pool.getConnection();
      
      const [agent] = await conn.query('SELECT * FROM agents WHERE id = ?', [agentId]);
      
      if (!agent) return baseSalary;
      
      // 협상 스킬에 따라 급여 감소 (높을수록 더 싸게 협상)
      const reduction = (agent.negotiation_skill / 100) * 0.1; // 최대 10% 감소
      const finalSalary = baseSalary * (1 - reduction);
      
      return Math.round(finalSalary);
    } catch (error) {
      console.error('에이전트 효과 적용 오류:', error);
      return baseSalary;
    } finally {
      if (conn) conn.release();
    }
  }
}

module.exports = AgentService;

