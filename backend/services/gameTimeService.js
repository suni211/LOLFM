const { pool } = require('../server');
const FinancialService = require('./financialService');

/**
 * 게임 시간 관리 서비스
 * 1시간 = 1달 (게임 내 시간)
 */
class GameTimeService {
  // 현재 게임 시간 조회
  static async getCurrentTime() {
    const conn = await pool.getConnection();
    try {
      const result = await conn.query(
        'SELECT * FROM game_time WHERE id = 1'
      );
      return result[0] || null;
    } finally {
      conn.release();
    }
  }

  // 게임 시간 업데이트 (1달 진행)
  static async advanceOneMonth() {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const currentTime = await this.getCurrentTime();
      if (!currentTime) {
        throw new Error('게임 시간이 설정되지 않았습니다.');
      }

      let newMonth = currentTime.current_month + 1;
      let newYear = currentTime.current_year;
      let isStoveLeague = false;

      // 12월이면 다음 해 1월로, 스토브리그 시작
      if (newMonth > 12) {
        newMonth = 1;
        newYear += 1;
      }

      // 12월 1일 ~ 1월 1일은 스토브리그
      if (newMonth === 12 || newMonth === 1) {
        isStoveLeague = true;
      }

      // 게임 시간 업데이트
      const newDate = new Date(newYear, newMonth - 1, 1);
      await conn.query(
        `UPDATE game_time 
         SET current_date = ?, current_month = ?, current_year = ?, is_stove_league = ?
         WHERE id = 1`,
        [newDate, newMonth, newYear, isStoveLeague]
      );

      // 모든 팀에 대해 월별 정산 처리
      const teams = await conn.query('SELECT id FROM teams WHERE is_game_over = FALSE');
      
      for (const team of teams) {
        try {
          await FinancialService.processMonthlySettlement(team.id);
        } catch (error) {
          console.error(`팀 ${team.id} 정산 처리 오류:`, error);
          // 개별 팀 정산 실패해도 계속 진행
        }
      }

      await conn.commit();

      return {
        month: newMonth,
        year: newYear,
        date: newDate,
        isStoveLeague
      };
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }

  // 스토브리그 기간 확인
  static async isStoveLeague() {
    const currentTime = await this.getCurrentTime();
    return currentTime ? currentTime.is_stove_league : false;
  }

  // 게임 시간 자동 진행 (백그라운드 작업)
  // 6시간 = 1달, 24시간 = 4달
  static startAutoAdvance() {
    // 6시간마다 자동으로 1달 진행
    setInterval(async () => {
      try {
        console.log('⏰ 게임 시간 자동 진행 중... (6시간 = 1달)');
        const result = await this.advanceOneMonth();
        console.log(`✅ 게임 시간 진행 완료: ${result.year}년 ${result.month}월`);
      } catch (error) {
        console.error('❌ 게임 시간 진행 오류:', error);
      }
    }, 6 * 60 * 60 * 1000); // 6시간
  }

  // 수동으로 4달 진행 (24시간 = 4달)
  static async advanceFourMonths() {
    const results = [];
    for (let i = 0; i < 4; i++) {
      const result = await this.advanceOneMonth();
      results.push(result);
    }
    return results;
  }
}

module.exports = GameTimeService;

