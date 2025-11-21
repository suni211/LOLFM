const pool = require('../database/pool');

class InjuryService {
  // 선수 부상 발생
  static async causeInjury(playerId, severity = 'minor') {
    let conn;
    try {
      conn = await pool.getConnection();
      
      const injuryDays = {
        minor: 7,
        moderate: 14,
        severe: 30
      };
      
      const days = injuryDays[severity] || 7;
      const recoveryDate = new Date();
      recoveryDate.setDate(recoveryDate.getDate() + days);
      
      await conn.query(
        `INSERT INTO player_injuries (player_id, injury_type, severity, injury_date, expected_recovery_date, status)
         VALUES (?, 'GENERAL', ?, CURDATE(), ?, 'ACTIVE')`,
        [playerId, severity, recoveryDate]
      );
      
      // 선수 컨디션 감소
      await conn.query(
        'UPDATE players SET `condition` = GREATEST(`condition` - 20, 0) WHERE id = ?',
        [playerId]
      );
      
      return { severity, days, recoveryDate };
    } catch (error) {
      console.error('부상 발생 오류:', error);
      throw error;
    } finally {
      if (conn) conn.release();
    }
  }
  
  // 부상 회복 체크
  static async checkRecovery() {
    let conn;
    try {
      conn = await pool.getConnection();
      
      const recovered = await conn.query(
        `SELECT * FROM player_injuries 
         WHERE status = 'ACTIVE' 
         AND expected_recovery_date <= CURDATE()`
      );
      
      for (const injury of recovered) {
        await conn.query(
          'UPDATE player_injuries SET status = "RECOVERED", recovery_date = CURDATE() WHERE id = ?',
          [injury.id]
        );
        
        // 선수 컨디션 회복
        await conn.query(
          'UPDATE players SET `condition` = LEAST(`condition` + 30, 100) WHERE id = ?',
          [injury.player_id]
        );
      }
      
      return recovered.length;
    } catch (error) {
      console.error('부상 회복 체크 오류:', error);
      return 0;
    } finally {
      if (conn) conn.release();
    }
  }
}

module.exports = InjuryService;

