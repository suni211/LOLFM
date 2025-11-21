const pool = require('../database/pool');

/**
 * 선수 관리 서비스
 * 포텐셜, 성장, 훈련, 컨디션 관리
 */
class PlayerService {
  // 선수 성장 처리
  static async processPlayerGrowth(playerId) {
    const conn = await pool.getConnection();
    try {
      const player = await conn.query(
        'SELECT * FROM players WHERE id = ?',
        [playerId]
      );
      
      if (player.length === 0) return null;
      const p = player[0];

      // 포텐셜에 따른 성장 계산
      const growthRate = this.calculateGrowthRate(p.potential, p.overall);
      
      // 장비 보너스 계산
      const equipment = await conn.query(
        'SELECT growth_bonus FROM equipment WHERE player_id = ?',
        [playerId]
      );
      let equipmentBonus = 0;
      equipment.forEach(eq => {
        equipmentBonus += parseFloat(eq.growth_bonus || 0);
      });

      // 훈련장 보너스
      let trainingBonus = 0;
      if (p.team_id) {
        const training = await conn.query(
          'SELECT growth_bonus FROM training_facilities WHERE team_id = ?',
          [p.team_id]
        );
        if (training.length > 0) {
          trainingBonus = parseFloat(training[0].growth_bonus || 0);
        }
      }

      // 총 성장률
      const totalGrowthRate = growthRate * (1 + (equipmentBonus + trainingBonus) / 100);

      // 스탯 증가 (포텐셜이 높을수록 더 많이 증가)
      const statIncrease = Math.floor(totalGrowthRate * (p.potential / 100));

      // 각 스탯 증가
      const stats = ['mental', 'teamfight', 'laning', 'jungling', 'cs_skill', 
                     'leadership', 'will', 'competitiveness', 'dirty_play'];
      
      const updates = {};
      stats.forEach(stat => {
        const currentValue = p[stat] || 50;
        const newValue = Math.min(100, currentValue + Math.floor(statIncrease * (Math.random() * 0.5 + 0.5)));
        updates[stat] = newValue;
      });

      // 오버롤 재계산
      const newOverall = this.calculateOverall(updates, p.position);

      // 업데이트
      await conn.query(
        `UPDATE players 
         SET mental = ?, teamfight = ?, laning = ?, jungling = ?, cs_skill = ?,
             leadership = ?, will = ?, competitiveness = ?, dirty_play = ?, overall = ?
         WHERE id = ?`,
        [
          updates.mental, updates.teamfight, updates.laning, updates.jungling, updates.cs_skill,
          updates.leadership, updates.will, updates.competitiveness, updates.dirty_play,
          newOverall, playerId
        ]
      );

      return { success: true, newOverall, statIncreases: updates };
    } finally {
      conn.release();
    }
  }

  // 성장률 계산
  static calculateGrowthRate(potential, overall) {
    // 포텐셜이 높고 오버롤이 낮을수록 빠르게 성장
    if (potential === 0) return 0;
    const baseRate = potential / 10;
    const overallFactor = (100 - overall) / 100;
    return baseRate * (0.5 + overallFactor * 0.5);
  }

  // 오버롤 계산
  static calculateOverall(stats, position) {
    let total = 0;
    let count = 0;

    // 포지션별 중요 스탯 가중치
    const weights = {
      'TOP': { laning: 1.2, teamfight: 1.1, mental: 1.0, cs_skill: 0.9 },
      'JGL': { jungling: 1.3, teamfight: 1.1, leadership: 1.2, mental: 1.0 },
      'MID': { laning: 1.2, teamfight: 1.2, cs_skill: 1.1, mental: 1.0 },
      'ADC': { laning: 1.1, cs_skill: 1.3, teamfight: 1.2, mental: 1.0 },
      'SPT': { teamfight: 1.1, leadership: 1.3, mental: 1.1, dirty_play: 1.2 }
    };

    const positionWeights = weights[position] || {};

    Object.keys(stats).forEach(stat => {
      const weight = positionWeights[stat] || 1.0;
      total += (stats[stat] || 50) * weight;
      count += weight;
    });

    return Math.round(total / count);
  }

  // 컨디션 관리
  static async updatePlayerCondition(playerId, change) {
    const conn = await pool.getConnection();
    try {
      const player = await conn.query(
        'SELECT `condition`, team_id FROM players WHERE id = ?',
        [playerId]
      );

      if (player.length === 0) return null;

      let newCondition = (player[0].condition || 50) + change;
      newCondition = Math.max(0, Math.min(100, newCondition));

      // 숙소 보너스 적용
      if (player[0].team_id) {
        const dormitory = await conn.query(
          'SELECT condition_bonus FROM dormitories WHERE team_id = ?',
          [player[0].team_id]
        );
        if (dormitory.length > 0) {
          newCondition = Math.min(100, newCondition + (dormitory[0].condition_bonus || 0));
        }
      }

      await conn.query(
        'UPDATE players SET `condition` = ? WHERE id = ?',
        [newCondition, playerId]
      );

      return newCondition;
    } finally {
      conn.release();
    }
  }

  // 훈련 시작
  static async startTraining(playerId, trainingType, focusStat = null) {
    const conn = await pool.getConnection();
    try {
      const player = await conn.query(
        'SELECT team_id FROM players WHERE id = ?',
        [playerId]
      );

      if (player.length === 0) throw new Error('선수를 찾을 수 없습니다.');

      // 훈련장 확인
      const training = await conn.query(
        'SELECT * FROM training_facilities WHERE team_id = ?',
        [player[0].team_id]
      );

      if (training.length === 0) throw new Error('훈련장이 없습니다.');

      // 동시 훈련 인원 확인
      const activeTrainings = await conn.query(
        'SELECT COUNT(*) as count FROM player_trainings WHERE status = "ACTIVE" AND player_id IN (SELECT id FROM players WHERE team_id = ?)',
        [player[0].team_id]
      );

      if (activeTrainings[0].count >= training[0].max_trainees) {
        throw new Error('훈련장이 가득 찼습니다.');
      }

      // 훈련 기간 설정 (개인: 7일, 팀: 14일)
      const duration = trainingType === 'INDIVIDUAL' ? 7 : 14;
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + duration);

      await conn.query(
        `INSERT INTO player_trainings (player_id, training_type, focus_stat, start_date, end_date, status)
         VALUES (?, ?, ?, ?, ?, 'ACTIVE')`,
        [playerId, trainingType, focusStat, startDate, endDate]
      );

      // 컨디션 감소 (과도한 훈련)
      await this.updatePlayerCondition(playerId, -5);

      return { success: true, endDate };
    } finally {
      conn.release();
    }
  }

  // 훈련 완료 처리
  static async completeTraining(trainingId) {
    const conn = await pool.getConnection();
    try {
      const training = await conn.query(
        'SELECT * FROM player_trainings WHERE id = ?',
        [trainingId]
      );

      if (training.length === 0) return null;

      const t = training[0];

      // 성장 적용
      if (t.training_type === 'INDIVIDUAL' && t.focus_stat) {
        // 개인 훈련: 특정 스탯 집중 향상
        await this.boostStat(t.player_id, t.focus_stat, 3);
      } else {
        // 팀 훈련: 전반적 향상
        await this.processPlayerGrowth(t.player_id);
      }

      await conn.query(
        'UPDATE player_trainings SET status = "COMPLETED" WHERE id = ?',
        [trainingId]
      );

      return { success: true };
    } finally {
      conn.release();
    }
  }

  // 특정 스탯 부스트
  static async boostStat(playerId, statName, amount) {
    const conn = await pool.getConnection();
    try {
      const player = await conn.query(
        `SELECT ${statName} FROM players WHERE id = ?`,
        [playerId]
      );

      if (player.length === 0) return null;

      const currentValue = player[0][statName] || 50;
      const newValue = Math.min(100, currentValue + amount);

      await conn.query(
        `UPDATE players SET ${statName} = ? WHERE id = ?`,
        [newValue, playerId]
      );

      return newValue;
    } finally {
      conn.release();
    }
  }

  // 부상 처리
  static async handleInjury(playerId, severity = 1) {
    const conn = await pool.getConnection();
    try {
      const recoveryDays = severity * 7; // 심각도 × 7일
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + recoveryDays);

      await conn.query(
        `INSERT INTO player_injuries (player_id, injury_type, severity, recovery_days, start_date, end_date, status)
         VALUES (?, '일반 부상', ?, ?, ?, ?, 'ACTIVE')`,
        [playerId, severity, recoveryDays, startDate, endDate]
      );

      // 컨디션 감소
      await this.updatePlayerCondition(playerId, -20 * severity);

      return { recoveryDays, endDate };
    } finally {
      conn.release();
    }
  }

  // 나이 증가 및 스탯 감소
  static async processAging(playerId) {
    const conn = await pool.getConnection();
    try {
      const player = await conn.query(
        'SELECT age, stat_decline_rate FROM players WHERE id = ?',
        [playerId]
      );

      if (player.length === 0) return null;

      const age = (player[0].age || 18) + 1;
      let declineRate = player[0].stat_decline_rate || 0;

      // 25세 이상부터 스탯 감소 시작
      if (age >= 25) {
        declineRate = Math.min(5, declineRate + 0.5); // 최대 5%까지 감소

        // 스탯 감소 적용
        const stats = ['mental', 'teamfight', 'laning', 'jungling', 'cs_skill'];
        for (const stat of stats) {
          await conn.query(
            `UPDATE players SET ${stat} = GREATEST(1, ${stat} - ?) WHERE id = ?`,
            [Math.floor(declineRate), playerId]
          );
        }
      }

      // 30세 이상부터 은퇴 가능성
      if (age >= 30 && Math.random() < 0.1) { // 10% 확률
        const retirementDate = new Date();
        retirementDate.setFullYear(retirementDate.getFullYear() + 1);
        await conn.query(
          'UPDATE players SET retirement_date = ? WHERE id = ?',
          [retirementDate, playerId]
        );
      }

      await conn.query(
        'UPDATE players SET age = ?, stat_decline_rate = ? WHERE id = ?',
        [age, declineRate, playerId]
      );

      return { age, declineRate };
    } finally {
      conn.release();
    }
  }
}

module.exports = PlayerService;

