const pool = require('../database/pool');
const FinancialService = require('./financialService');

/**
 * 게임 시간 관리 서비스
 * 6시간 = 1달 (게임 내 시간)
 * 24시간 = 4달
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

      // 12월이면 다음 해 1월로
      if (newMonth > 12) {
        newMonth = 1;
        newYear += 1;
      }

      // 12월 1일 ~ 1월 1일은 스토브리그
      if (newMonth === 12 || newMonth === 1) {
        isStoveLeague = true;
      } else {
        isStoveLeague = false;
      }

      // 게임 시간 업데이트
      const newDate = new Date(newYear, newMonth - 1, 1);
      await conn.query(
        `UPDATE game_time 
         SET \`current_date\` = ?, \`current_month\` = ?, \`current_year\` = ?, is_stove_league = ?
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

      // 이번 달 예정된 경기 자동 진행
      await this.processScheduledMatches(conn, newYear, newMonth);
      
      // 랜덤 이벤트 체크
      const EventService = require('./eventService');
      await EventService.checkMonthlyEvents();
      
      // 부상 회복 체크
      const InjuryService = require('./injuryService');
      await InjuryService.checkRecovery();

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

  // 예정된 경기 자동 진행
  static async processScheduledMatches(conn, year, month) {
    try {
      const MatchService = require('./matchService');
      
      // 이번 달 예정된 경기 조회
      const matches = await conn.query(
        `SELECT * FROM matches 
         WHERE status = 'scheduled' 
         AND YEAR(match_date) = ? 
         AND MONTH(match_date) = ?
         ORDER BY match_date ASC`,
        [year, month]
      );
      
      console.log(`📅 ${year}년 ${month}월 예정된 경기: ${matches.length}경기`);
      
      // 각 경기 시뮬레이션
      for (const match of matches) {
        try {
          await MatchService.simulateMatch(match.id);
          console.log(`✅ 경기 ${match.id} 완료: ${match.home_team_id} vs ${match.away_team_id}`);
        } catch (error) {
          console.error(`❌ 경기 ${match.id} 시뮬레이션 오류:`, error);
          // 개별 경기 실패해도 계속 진행
        }
      }
    } catch (error) {
      console.error('경기 자동 진행 오류:', error);
    }
  }
}

module.exports = GameTimeService;

