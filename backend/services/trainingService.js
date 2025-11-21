const pool = require('../database/pool');

class TrainingService {
  // 선수 훈련
  static async trainPlayer(playerId, trainingType) {
    let conn;
    try {
      conn = await pool.getConnection();
      
      // 선수 정보 조회
      const [player] = await conn.query(
        'SELECT * FROM players WHERE id = ?',
        [playerId]
      );
      
      if (!player) {
        throw new Error('선수를 찾을 수 없습니다.');
      }
      
      // 컨디션 체크
      if (player.condition < 50) {
        throw new Error('선수의 컨디션이 너무 낮습니다. 휴식이 필요합니다.');
      }
      
      // 훈련 효과 계산
      const trainingEffect = this.calculateTrainingEffect(player, trainingType);
      
      // 능력치 업데이트
      const updateQuery = this.buildUpdateQuery(trainingType, trainingEffect);
      
      await conn.query(
        `UPDATE players 
         SET ${updateQuery}, \`condition\` = \`condition\` - 10
         WHERE id = ?`,
        [playerId]
      );
      
      console.log(`선수 ${player.name} 훈련 완료: ${trainingType}`);
      
      return {
        success: true,
        improvement: trainingEffect,
        newCondition: player.condition - 10
      };
    } catch (error) {
      console.error('훈련 오류:', error);
      throw error;
    } finally {
      if (conn) conn.release();
    }
  }
  
  // 훈련 효과 계산
  static calculateTrainingEffect(player, trainingType) {
    const baseImprovement = 1;
    const potentialBonus = player.potential / 100;
    
    return Math.ceil(baseImprovement * (1 + potentialBonus));
  }
  
  // 업데이트 쿼리 생성
  static buildUpdateQuery(trainingType, effect) {
    const statMap = {
      mental: 'mental',
      teamfight: 'teamfight',
      laning: 'laning',
      jungling: 'jungling',
      cs: 'cs_skill',
      leadership: 'leadership'
    };
    
    const stat = statMap[trainingType];
    if (!stat) {
      throw new Error('잘못된 훈련 타입입니다.');
    }
    
    return `${stat} = LEAST(${stat} + ${effect}, 100), overall = LEAST(overall + ${Math.ceil(effect / 2)}, 100)`;
  }
  
  // 선수 휴식
  static async restPlayer(playerId) {
    let conn;
    try {
      conn = await pool.getConnection();
      
      await conn.query(
        'UPDATE players SET `condition` = LEAST(`condition` + 30, 100) WHERE id = ?',
        [playerId]
      );
      
      console.log(`선수 휴식 완료: ${playerId}`);
      
      return { success: true };
    } catch (error) {
      console.error('휴식 오류:', error);
      throw error;
    } finally {
      if (conn) conn.release();
    }
  }
}

module.exports = TrainingService;

