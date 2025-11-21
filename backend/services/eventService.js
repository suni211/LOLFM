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
      
      // 이벤트 저장 (effect는 JSON으로 저장)
      const effectJson = JSON.stringify(randomEvent.effect);
      await conn.query(
        `INSERT INTO random_events (team_id, event_type, title, description, effect, event_date)
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [teamId, randomEvent.type, randomEvent.title, randomEvent.message, effectJson]
      );
      
      // 효과는 처리 시 적용
      return randomEvent;
    } catch (error) {
      console.error('랜덤 이벤트 생성 오류:', error);
      return null;
    } finally {
      if (conn) conn.release();
    }
  }
  
  // 이벤트 처리
  static async processEvent(eventId) {
    let conn;
    try {
      conn = await pool.getConnection();
      
      // 이벤트 조회
      const [events] = await conn.query('SELECT * FROM random_events WHERE id = ?', [eventId]);
      if (!events || events.length === 0) {
        throw new Error('이벤트를 찾을 수 없습니다.');
      }
      
      const event = events[0];
      
      if (event.is_processed) {
        throw new Error('이미 처리된 이벤트입니다.');
      }
      
      // 효과 파싱 및 적용
      let effect = {};
      try {
        effect = typeof event.effect === 'string' ? JSON.parse(event.effect) : event.effect;
      } catch (e) {
        effect = {};
      }
      
      if (effect.money && effect.money > 0) {
        await conn.query('UPDATE teams SET money = money + ? WHERE id = ?', 
          [effect.money, event.team_id]);
      }
      if (effect.awareness && effect.awareness > 0) {
        await conn.query('UPDATE teams SET awareness = awareness + ? WHERE id = ?', 
          [effect.awareness, event.team_id]);
      }
      
      // 이벤트 처리 완료 표시
      await conn.query(
        'UPDATE random_events SET is_processed = TRUE WHERE id = ?',
        [eventId]
      );
      
      return { success: true, effect };
    } catch (error) {
      console.error('이벤트 처리 오류:', error);
      throw error;
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
