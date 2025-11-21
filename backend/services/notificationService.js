const pool = require('../database/pool');

// io는 동적으로 가져오기 (순환 의존성 방지)
let io = null;

/**
 * 알림 서비스
 */
class NotificationService {
  // io 설정 (server.js에서 호출)
  static setIO(socketIO) {
    io = socketIO;
  }

  // 알림 생성
  static async createNotification(userId, teamId, type, title, message, priority = 'MEDIUM') {
    const conn = await pool.getConnection();
    try {
      const result = await conn.query(
        `INSERT INTO notifications (user_id, team_id, type, title, message, priority)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, teamId, type, title, message, priority]
      );

      // Socket.IO로 실시간 알림 전송
      if (io) {
        io.to(`user_${userId}`).emit('notification', {
          id: result.insertId,
          type,
          title,
          message,
          priority
        });
      }

      return result.insertId;
    } finally {
      conn.release();
    }
  }

  // 자금 경고 알림
  static async createFinancialWarning(teamId, deficit) {
    const conn = await pool.getConnection();
    try {
      const team = await conn.query('SELECT user_id FROM teams WHERE id = ?', [teamId]);
      if (team.length === 0) return;

      await this.createNotification(
        team[0].user_id,
        teamId,
        'FINANCIAL_WARNING',
        '자금 부족 경고',
        `다음 달 유지비를 감당할 수 없습니다. 부족 금액: ${deficit.toLocaleString()}원`,
        'HIGH'
      );
    } finally {
      conn.release();
    }
  }

  // 구조조정 알림
  static async createRestructuringNotification(teamId) {
    const conn = await pool.getConnection();
    try {
      const team = await conn.query('SELECT user_id FROM teams WHERE id = ?', [teamId]);
      if (team.length === 0) return;

      await this.createNotification(
        team[0].user_id,
        teamId,
        'RESTRUCTURING',
        '구조조정 시작',
        '팀이 구조조정에 들어갔습니다. 선수 해고 및 시설 하락이 발생했습니다.',
        'URGENT'
      );
    } finally {
      conn.release();
    }
  }

  // 경기 일정 알림
  static async createMatchNotification(teamId, matchDate, opponent) {
    const conn = await pool.getConnection();
    try {
      const team = await conn.query('SELECT user_id FROM teams WHERE id = ?', [teamId]);
      if (team.length === 0) return;

      await this.createNotification(
        team[0].user_id,
        teamId,
        'MATCH_SCHEDULE',
        '경기 일정',
        `${opponent}와의 경기가 예정되어 있습니다.`,
        'MEDIUM'
      );
    } finally {
      conn.release();
    }
  }

  // 경기 결과 알림
  static async createMatchResultNotification(teamId, isWin, opponent, score) {
    const conn = await pool.getConnection();
    try {
      const team = await conn.query('SELECT user_id FROM teams WHERE id = ?', [teamId]);
      if (team.length === 0) return;

      await this.createNotification(
        team[0].user_id,
        teamId,
        'MATCH_RESULT',
        isWin ? '경기 승리!' : '경기 패배',
        `${opponent}와의 경기에서 ${isWin ? '승리' : '패배'}했습니다. (${score})`,
        'MEDIUM'
      );
    } finally {
      conn.release();
    }
  }

  // 시설 업그레이드 완료 알림
  static async createFacilityUpgradeCompleteNotification(teamId, facilityName, newLevel) {
    const conn = await pool.getConnection();
    try {
      const team = await conn.query('SELECT user_id FROM teams WHERE id = ?', [teamId]);
      if (team.length === 0) return;

      await this.createNotification(
        team[0].user_id,
        teamId,
        'FACILITY_UPGRADE',
        '시설 업그레이드 완료',
        `${facilityName}이(가) 레벨 ${newLevel}로 업그레이드되었습니다!`,
        'LOW'
      );
    } finally {
      conn.release();
    }
  }

  // 스폰서 제안 알림
  static async createSponsorOfferNotification(teamId, sponsorName) {
    const conn = await pool.getConnection();
    try {
      const team = await conn.query('SELECT user_id FROM teams WHERE id = ?', [teamId]);
      if (team.length === 0) return;

      await this.createNotification(
        team[0].user_id,
        teamId,
        'SPONSOR_OFFER',
        '스폰서 제안',
        `${sponsorName}에서 스폰서 계약을 제안했습니다!`,
        'MEDIUM'
      );
    } finally {
      conn.release();
    }
  }
}

module.exports = NotificationService;

