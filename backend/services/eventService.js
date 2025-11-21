const pool = require('../database/pool');

class EventService {
  // 랜덤 이벤트 생성
  static async generateRandomEvent(teamId) {
    let conn;
    try {
      conn = await pool.getConnection();
      
      const events = [
        {
          type: 'SPONSOR_OFFER',
          title: '스폰서 제안',
          message: '새로운 스폰서가 계약을 제안했습니다!',
          effect: { money: 0, awareness: 0 }
        },
        {
          type: 'PLAYER_SCOUT',
          title: '선수 스카우트',
          message: '유망한 선수를 발견했습니다!',
          effect: { money: 0, awareness: 0 }
        },
        {
          type: 'FACILITY_BONUS',
          title: '시설 보너스',
          message: '시설 개선으로 선수들의 컨디션이 향상되었습니다!',
          effect: { money: 0, awareness: 0 }
        },
        {
          type: 'FAN_EVENT',
          title: '팬 이벤트',
          message: '팬 이벤트로 인지도가 증가했습니다!',
          effect: { money: 0, awareness: 50 }
        },
        {
          type: 'FINANCIAL_BONUS',
          title: '재정 보너스',
          message: '예상치 못한 수입이 발생했습니다!',
          effect: { money: 10000000, awareness: 0 }
        }
      ];
      
      const randomEvent = events[Math.floor(Math.random() * events.length)];
      
      // 이벤트 저장
      await conn.query(
        `INSERT INTO random_events (team_id, event_type, title, message, effect_money, effect_awareness, event_date)
         VALUES (?, ?, ?, ?, ?, ?, CURDATE())`,
        [teamId, randomEvent.type, randomEvent.title, randomEvent.message, 
         randomEvent.effect.money, randomEvent.effect.awareness]
      );
      
      // 효과 적용
      if (randomEvent.effect.money > 0) {
        await conn.query('UPDATE teams SET money = money + ? WHERE id = ?', 
          [randomEvent.effect.money, teamId]);
      }
      if (randomEvent.effect.awareness > 0) {
        await conn.query('UPDATE teams SET awareness = awareness + ? WHERE id = ?', 
          [randomEvent.effect.awareness, teamId]);
      }
      
      return randomEvent;
    } catch (error) {
      console.error('랜덤 이벤트 생성 오류:', error);
      return null;
    } finally {
      if (conn) conn.release();
    }
  }
  
  // 월별 랜덤 이벤트 체크
  static async checkMonthlyEvents() {
    let conn;
    try {
      conn = await pool.getConnection();
      
      const teams = await conn.query('SELECT id FROM teams WHERE is_game_over = FALSE');
      
      for (const team of teams) {
        // 30% 확률로 이벤트 발생
        if (Math.random() < 0.3) {
          await this.generateRandomEvent(team.id);
        }
      }
    } catch (error) {
      console.error('월별 이벤트 체크 오류:', error);
    } finally {
      if (conn) conn.release();
    }
  }
}

module.exports = EventService;
