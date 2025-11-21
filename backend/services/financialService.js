const pool = require('../database/pool');

/**
 * 시설 유지비 계산
 */
class FinancialService {
  // 경기장 유지비 계산 (레벨별)
  static getStadiumMaintenanceCost(level) {
    const costs = {
      1: 500000,    // 50만원
      2: 1000000,   // 100만원
      3: 2000000,   // 200만원
      4: 4000000,   // 400만원
      5: 8000000,   // 800만원
      6: 15000000,  // 1500만원
      7: 30000000,  // 3000만원
      8: 60000000,  // 6000만원
      9: 120000000, // 1억 2천만원
      10: 250000000 // 2억 5천만원
    };
    return costs[level] || 0;
  }

  // 숙소 유지비 계산 (레벨별)
  static getDormitoryMaintenanceCost(level) {
    const costs = {
      1: 300000,    // 30만원
      2: 600000,    // 60만원
      3: 1200000,   // 120만원
      4: 2500000,   // 250만원
      5: 5000000,   // 500만원
      6: 10000000,  // 1000만원
      7: 20000000,  // 2000만원
      8: 40000000,  // 4000만원
      9: 80000000,  // 8000만원
      10: 150000000, // 1억 5천만원
      11: 200000000, // 2억
      12: 250000000, // 2억 5천만원
      13: 300000000, // 3억
      14: 350000000, // 3억 5천만원
      15: 400000000, // 4억
      16: 450000000, // 4억 5천만원
      17: 500000000, // 5억
      18: 550000000, // 5억 5천만원
      19: 600000000, // 6억
      20: 700000000  // 7억
    };
    return costs[level] || 0;
  }

  // 팀의 월 총 유지비 계산
  static async calculateMonthlyMaintenance(teamId) {
    const conn = await pool.getConnection();
    try {
      // 경기장 유지비
      const stadium = await conn.query(
        'SELECT level FROM stadiums WHERE team_id = ?',
        [teamId]
      );
      let stadiumCost = 0;
      if (stadium.length > 0) {
        stadiumCost = this.getStadiumMaintenanceCost(stadium[0].level);
      }

      // 숙소 유지비
      const dormitory = await conn.query(
        'SELECT level FROM dormitories WHERE team_id = ?',
        [teamId]
      );
      let dormitoryCost = 0;
      if (dormitory.length > 0) {
        dormitoryCost = this.getDormitoryMaintenanceCost(dormitory[0].level);
      }

      // 선수 주급 합계
      const players = await conn.query(
        'SELECT SUM(salary) as total_salary FROM players WHERE team_id = ?',
        [teamId]
      );
      const salaryCost = players[0].total_salary || 0;

      return {
        stadium: stadiumCost,
        dormitory: dormitoryCost,
        salary: salaryCost,
        total: stadiumCost + dormitoryCost + salaryCost
      };
    } finally {
      conn.release();
    }
  }

  // 월별 정산 처리
  static async processMonthlySettlement(teamId) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // 현재 자금 확인
      const team = await conn.query(
        'SELECT money FROM teams WHERE id = ?',
        [teamId]
      );
      if (team.length === 0) {
        throw new Error('팀을 찾을 수 없습니다.');
      }

      let currentMoney = team[0].money;

      // 유지비 계산
      const maintenance = await this.calculateMonthlyMaintenance(teamId);

      // 유지비 차감
      currentMoney -= maintenance.total;

      // 유지비 기록
      if (maintenance.total > 0) {
        await conn.query(
          `INSERT INTO financial_records (team_id, type, category, amount, description, record_date)
           VALUES (?, 'EXPENSE', 'MAINTENANCE', ?, ?, CURDATE())`,
          [
            teamId,
            maintenance.total,
            `경기장: ${maintenance.stadium.toLocaleString()}원, 숙소: ${maintenance.dormitory.toLocaleString()}원, 주급: ${maintenance.salary.toLocaleString()}원`
          ]
        );
      }

      // 자금 업데이트
      await conn.query(
        'UPDATE teams SET money = ? WHERE id = ?',
        [currentMoney, teamId]
      );

      // 파산 체크
      if (currentMoney < 0) {
        await this.handleBankruptcy(teamId, currentMoney, conn);
      } else if (currentMoney < 10000000) { // 1천만원 미만 시 경고
        // 경고 기록 (선택사항)
      }

      await conn.commit();
      return { success: true, newBalance: currentMoney, maintenance };
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }

  // 파산 처리
  static async handleBankruptcy(teamId, currentMoney, conn) {
    // 구조조정 시도
    const restructuringSuccess = await this.attemptRestructuring(teamId, currentMoney, conn);

    if (!restructuringSuccess) {
      // 구조조정 실패 시 게임오버
      await this.handleGameOver(teamId, conn);
    }
  }

  // 구조조정 시도
  static async attemptRestructuring(teamId, currentMoney, conn) {
    // 구조조정 횟수 확인
    const team = await conn.query(
      'SELECT restructuring_count, is_restructuring FROM teams WHERE id = ?',
      [teamId]
    );

    if (team.length === 0) return false;

    const restructuringCount = team[0].restructuring_count || 0;

    // 이미 구조조정 중이거나 3회 이상이면 실패
    if (team[0].is_restructuring || restructuringCount >= 3) {
      return false;
    }

    // 구조조정 시작
    await conn.query(
      'UPDATE teams SET is_restructuring = TRUE, restructuring_count = restructuring_count + 1 WHERE id = ?',
      [teamId]
    );

    // 1. 고액 연봉 선수 해고 (연봉 높은 순서대로)
    const highSalaryPlayers = await conn.query(
      'SELECT id, name, salary FROM players WHERE team_id = ? ORDER BY salary DESC LIMIT 2',
      [teamId]
    );

    let savedMoney = 0;
    for (const player of highSalaryPlayers) {
      await conn.query(
        'UPDATE players SET team_id = NULL, salary = 0, contract_start = NULL, contract_end = NULL WHERE id = ?',
        [player.id]
      );
      savedMoney += player.salary;
    }

    // 2. 시설 레벨 강제 하락
    // 경기장 1레벨 하락
    const stadium = await conn.query(
      'SELECT level FROM stadiums WHERE team_id = ?',
      [teamId]
    );
    if (stadium.length > 0 && stadium[0].level > 1) {
      await conn.query(
        'UPDATE stadiums SET level = level - 1 WHERE team_id = ?',
        [teamId]
      );
    }

    // 숙소 1레벨 하락
    const dormitory = await conn.query(
      'SELECT level FROM dormitories WHERE team_id = ?',
      [teamId]
    );
    if (dormitory.length > 0 && dormitory[0].level > 1) {
      await conn.query(
        'UPDATE dormitories SET level = level - 1 WHERE team_id = ?',
        [teamId]
      );
    }

    // 3. 스폰서 계약 해지
    await conn.query(
      'DELETE FROM sponsors WHERE team_id = ?',
      [teamId]
    );

    // 4. 팬 수 감소 (50% 감소)
    await conn.query(
      'UPDATE teams SET fans = FLOOR(fans * 0.5) WHERE id = ?',
      [teamId]
    );

    // 5. 자금을 0으로 조정 (부채는 없음)
    await conn.query(
      'UPDATE teams SET money = 0 WHERE id = ?',
      [teamId]
    );

    // 구조조정 이력 기록
    await conn.query(
      `INSERT INTO bankruptcy_history (team_id, event_type, money_before, money_after, details)
       VALUES (?, 'RESTRUCTURING', ?, 0, ?)`,
      [
        teamId,
        currentMoney,
        JSON.stringify({
          firedPlayers: highSalaryPlayers.map(p => ({ id: p.id, name: p.name, salary: p.salary })),
          savedMoney: savedMoney,
          stadiumDowngrade: stadium.length > 0 && stadium[0].level > 1,
          dormitoryDowngrade: dormitory.length > 0 && dormitory[0].level > 1
        })
      ]
    );

    return true;
  }

  // 게임오버 처리
  static async handleGameOver(teamId, conn) {
    // 게임오버 상태로 변경
    await conn.query(
      'UPDATE teams SET is_game_over = TRUE, is_bankrupt = TRUE, bankruptcy_date = NOW() WHERE id = ?',
      [teamId]
    );

    // 게임오버 이력 기록
    await conn.query(
      `INSERT INTO bankruptcy_history (team_id, event_type, money_before, money_after, details)
       VALUES (?, 'GAME_OVER', 0, 0, ?)`,
      [
        teamId,
        JSON.stringify({ message: '게임오버: 계정 영구 차단' })
      ]
    );

    // 모든 선수 해고
    await conn.query(
      'UPDATE players SET team_id = NULL, salary = 0, contract_start = NULL, contract_end = NULL WHERE team_id = ?',
      [teamId]
    );

    // 모든 스폰서 해지
    await conn.query(
      'DELETE FROM sponsors WHERE team_id = ?',
      [teamId]
    );
  }

  // 자금 경고 체크
  static async checkFinancialWarning(teamId) {
    const conn = await pool.getConnection();
    try {
      const team = await conn.query(
        'SELECT money FROM teams WHERE id = ?',
        [teamId]
      );

      if (team.length === 0) return null;

      const money = team[0].money;
      const maintenance = await this.calculateMonthlyMaintenance(teamId);

      // 다음 달 유지비를 감당할 수 없으면 경고
      if (money < maintenance.total) {
        return {
          warning: true,
          currentMoney: money,
          nextMonthCost: maintenance.total,
          deficit: maintenance.total - money
        };
      }

      return { warning: false };
    } finally {
      conn.release();
    }
  }
}

module.exports = FinancialService;

