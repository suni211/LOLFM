const { pool } = require('../server');
const GameTimeService = require('./gameTimeService');

/**
 * 협상 시스템 서비스
 */
class NegotiationService {
  // 협상 제안 생성
  static async createNegotiation(playerId, fromTeamId, toTeamId, type, offer) {
    const conn = await pool.getConnection();
    try {
      // 스토브리그 기간 확인
      const isStoveLeague = await GameTimeService.isStoveLeague();
      if (!isStoveLeague) {
        throw new Error('협상은 스토브리그 기간(12월~1월)에만 가능합니다.');
      }

      const player = await conn.query(
        'SELECT * FROM players WHERE id = ?',
        [playerId]
      );

      if (player.length === 0) throw new Error('선수를 찾을 수 없습니다.');

      const p = player[0];

      // 만족도 확인
      const satisfaction = await conn.query(
        'SELECT * FROM player_satisfaction WHERE player_id = ?',
        [playerId]
      );

      let satisfactionScore = 50;
      if (satisfaction.length > 0) {
        satisfactionScore = satisfaction[0].satisfaction_score;
      }

      // 협상 난이도 계산
      const difficulty = this.calculateNegotiationDifficulty(p, satisfactionScore, offer);

      await conn.query(
        `INSERT INTO negotiations 
         (player_id, from_team_id, to_team_id, type, salary_offer, contract_duration, transfer_fee, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING')`,
        [
          playerId,
          fromTeamId,
          toTeamId,
          type,
          offer.salary,
          offer.duration || 12,
          type === 'TRANSFER' ? offer.transferFee : null
        ]
      );

      return { success: true, difficulty };
    } finally {
      conn.release();
    }
  }

  // 협상 난이도 계산
  static calculateNegotiationDifficulty(player, satisfactionScore, offer) {
    let difficulty = 50; // 기본 난이도

    // 만족도가 낮으면 협상 쉬움
    if (satisfactionScore < 30) difficulty -= 20;
    else if (satisfactionScore > 70) difficulty += 20;

    // 제안 급여가 현재 급여보다 낮으면 어려움
    if (offer.salary < (player.salary || 0)) difficulty += 30;

    // 승부욕이 높으면 좋은 팀에 가고 싶어함
    if (player.competitiveness > 70) {
      // TODO: 팀 성적 확인하여 조정
    }

    return Math.max(0, Math.min(100, difficulty));
  }

  // 협상 수락/거절
  static async respondToNegotiation(negotiationId, accept) {
    const conn = await pool.getConnection();
    try {
      const negotiation = await conn.query(
        'SELECT * FROM negotiations WHERE id = ?',
        [negotiationId]
      );

      if (negotiation.length === 0) throw new Error('협상을 찾을 수 없습니다.');

      const n = negotiation[0];

      if (accept) {
        // 협상 수락
        await conn.query(
          'UPDATE negotiations SET status = "ACCEPTED" WHERE id = ?',
          [negotiationId]
        );

        // 선수 이적/계약 처리
        if (n.type === 'TRANSFER') {
          // 이적료 지급
          await conn.query(
            'UPDATE teams SET money = money - ? WHERE id = ?',
            [n.transfer_fee, n.to_team_id]
          );
          await conn.query(
            'UPDATE teams SET money = money + ? WHERE id = ?',
            [n.transfer_fee, n.from_team_id]
          );
        }

        // 선수 팀 변경
        const contractEnd = new Date();
        contractEnd.setMonth(contractEnd.getMonth() + n.contract_duration);

        await conn.query(
          `UPDATE players 
           SET team_id = ?, salary = ?, contract_start = CURDATE(), contract_end = ?
           WHERE id = ?`,
          [n.to_team_id, n.salary_offer, contractEnd, n.player_id]
        );
      } else {
        // 협상 거절
        await conn.query(
          'UPDATE negotiations SET status = "REJECTED" WHERE id = ?',
          [negotiationId]
        );
      }

      return { success: true, accepted: accept };
    } finally {
      conn.release();
    }
  }

  // 선수 만족도 업데이트
  static async updatePlayerSatisfaction(playerId) {
    const conn = await pool.getConnection();
    try {
      const player = await conn.query(
        'SELECT * FROM players WHERE id = ?',
        [playerId]
      );

      if (player.length === 0) return null;

      const p = player[0];
      const team = await conn.query(
        'SELECT * FROM teams WHERE id = ?',
        [p.team_id]
      );

      if (team.length === 0) return null;

      const t = team[0];

      // 급여 만족도
      const salarySatisfaction = p.salary > 10000000 ? 70 : p.salary > 5000000 ? 50 : 30;

      // 팀 성적 만족도 (간단히)
      const performanceSatisfaction = t.reputation > 50 ? 70 : t.reputation > 20 ? 50 : 30;

      // 시설 만족도
      const facilitySatisfaction = 50; // TODO: 시설 레벨 기반 계산

      // 종합 만족도
      const totalSatisfaction = Math.round(
        (salarySatisfaction * 0.4 + performanceSatisfaction * 0.4 + facilitySatisfaction * 0.2)
      );

      await conn.query(
        `INSERT INTO player_satisfaction 
         (player_id, satisfaction_score, salary_satisfaction, team_performance_satisfaction, facility_satisfaction)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE 
         satisfaction_score = ?, salary_satisfaction = ?, team_performance_satisfaction = ?, facility_satisfaction = ?`,
        [
          playerId, totalSatisfaction, salarySatisfaction, performanceSatisfaction, facilitySatisfaction,
          totalSatisfaction, salarySatisfaction, performanceSatisfaction, facilitySatisfaction
        ]
      );

      return totalSatisfaction;
    } finally {
      conn.release();
    }
  }
}

module.exports = NegotiationService;

