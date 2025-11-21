const pool = require('../database/pool');
const PlayerService = require('./playerService');
const SponsorService = require('./sponsorService');

/**
 * 랜덤 이벤트 서비스
 */
class EventService {
  // 랜덤 이벤트 생성
  static async generateRandomEvent(teamId = null) {
    const conn = await pool.getConnection();
    try {
      const eventTypes = [
        'PLAYER_INJURY',
        'SPONSOR_OFFER',
        'SPECIAL_BONUS',
        'PLAYER_RETIREMENT',
        'FAN_EVENT'
      ];

      const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      let event = null;

      switch (eventType) {
        case 'PLAYER_INJURY':
          event = await this.createPlayerInjuryEvent(teamId);
          break;
        case 'SPONSOR_OFFER':
          event = await this.createSponsorOfferEvent(teamId);
          break;
        case 'SPECIAL_BONUS':
          event = await this.createSpecialBonusEvent(teamId);
          break;
        case 'PLAYER_RETIREMENT':
          event = await this.createPlayerRetirementEvent(teamId);
          break;
        case 'FAN_EVENT':
          event = await this.createFanEvent(teamId);
          break;
      }

      if (event) {
        await conn.query(
          `INSERT INTO random_events (team_id, event_type, title, description, effect, is_processed)
           VALUES (?, ?, ?, ?, ?, FALSE)`,
          [teamId, eventType, event.title, event.description, JSON.stringify(event.effect)]
        );
      }

      return event;
    } finally {
      conn.release();
    }
  }

  // 선수 부상 이벤트
  static async createPlayerInjuryEvent(teamId) {
    const conn = await pool.getConnection();
    try {
      if (!teamId) {
        const teams = await conn.query('SELECT id FROM teams WHERE is_game_over = FALSE ORDER BY RAND() LIMIT 1');
        if (teams.length === 0) return null;
        teamId = teams[0].id;
      }

      const players = await conn.query(
        'SELECT id, name FROM players WHERE team_id = ? ORDER BY RAND() LIMIT 1',
        [teamId]
      );

      if (players.length === 0) return null;

      const player = players[0];
      const severity = Math.floor(Math.random() * 3) + 1; // 1-3

      return {
        title: '선수 부상 발생',
        description: `${player.name} 선수가 부상을 당했습니다.`,
        effect: {
          playerId: player.id,
          severity: severity,
          recoveryDays: severity * 7
        }
      };
    } finally {
      conn.release();
    }
  }

  // 스폰서 제안 이벤트
  static async createSponsorOfferEvent(teamId) {
    const conn = await pool.getConnection();
    try {
      if (!teamId) {
        const teams = await conn.query('SELECT id FROM teams WHERE is_game_over = FALSE ORDER BY RAND() LIMIT 1');
        if (teams.length === 0) return null;
        teamId = teams[0].id;
      }

      const sponsor = await SponsorService.offerSponsor(teamId);
      if (!sponsor) return null;

      return {
        title: '스폰서 제안',
        description: `${sponsor.name}에서 스폰서 계약을 제안했습니다.`,
        effect: {
          sponsor: sponsor
        }
      };
    } finally {
      conn.release();
    }
  }

  // 특별 보너스 이벤트
  static async createSpecialBonusEvent(teamId) {
    const conn = await pool.getConnection();
    try {
      if (!teamId) {
        const teams = await conn.query('SELECT id FROM teams WHERE is_game_over = FALSE ORDER BY RAND() LIMIT 1');
        if (teams.length === 0) return null;
        teamId = teams[0].id;
      }

      const bonus = Math.floor(Math.random() * 50000000) + 10000000; // 1천만 ~ 5천만

      return {
        title: '특별 보너스',
        description: `예상치 못한 수입이 발생했습니다!`,
        effect: {
          money: bonus
        }
      };
    } finally {
      conn.release();
    }
  }

  // 선수 은퇴 이벤트
  static async createPlayerRetirementEvent(teamId) {
    const conn = await pool.getConnection();
    try {
      if (!teamId) {
        const teams = await conn.query('SELECT id FROM teams WHERE is_game_over = FALSE ORDER BY RAND() LIMIT 1');
        if (teams.length === 0) return null;
        teamId = teams[0].id;
      }

      const players = await conn.query(
        'SELECT id, name, age FROM players WHERE team_id = ? AND age >= 28 ORDER BY RAND() LIMIT 1',
        [teamId]
      );

      if (players.length === 0) return null;

      const player = players[0];

      return {
        title: '선수 은퇴 발표',
        description: `${player.name} 선수가 은퇴를 발표했습니다.`,
        effect: {
          playerId: player.id
        }
      };
    } finally {
      conn.release();
    }
  }

  // 팬 이벤트
  static async createFanEvent(teamId) {
    const conn = await pool.getConnection();
    try {
      if (!teamId) {
        const teams = await conn.query('SELECT id FROM teams WHERE is_game_over = FALSE ORDER BY RAND() LIMIT 1');
        if (teams.length === 0) return null;
        teamId = teams[0].id;
      }

      const fanChange = Math.floor(Math.random() * 500) + 100; // 100-600

      return {
        title: '팬 이벤트',
        description: `팬 이벤트가 성공적으로 개최되어 팬이 증가했습니다!`,
        effect: {
          fans: fanChange
        }
      };
    } finally {
      conn.release();
    }
  }

  // 이벤트 처리
  static async processEvent(eventId) {
    const conn = await pool.getConnection();
    try {
      const event = await conn.query(
        'SELECT * FROM random_events WHERE id = ? AND is_processed = FALSE',
        [eventId]
      );

      if (event.length === 0) return null;

      const e = event[0];
      const effect = JSON.parse(e.effect || '{}');

      switch (e.event_type) {
        case 'PLAYER_INJURY':
          await PlayerService.handleInjury(effect.playerId, effect.severity);
          break;
        case 'SPONSOR_OFFER':
          // 스폰서 제안은 수동으로 처리
          break;
        case 'SPECIAL_BONUS':
          await conn.query(
            'UPDATE teams SET money = money + ? WHERE id = ?',
            [effect.money, e.team_id]
          );
          break;
        case 'PLAYER_RETIREMENT':
          await conn.query(
            'UPDATE players SET team_id = NULL, salary = 0 WHERE id = ?',
            [effect.playerId]
          );
          break;
        case 'FAN_EVENT':
          await conn.query(
            'UPDATE teams SET fans = fans + ? WHERE id = ?',
            [effect.fans, e.team_id]
          );
          break;
      }

      await conn.query(
        'UPDATE random_events SET is_processed = TRUE WHERE id = ?',
        [eventId]
      );

      return { success: true };
    } finally {
      conn.release();
    }
  }

  // 주기적으로 랜덤 이벤트 생성
  static startRandomEventGeneration(intervalHours = 24) {
    setInterval(async () => {
      try {
        // 랜덤하게 팀 선택하여 이벤트 생성
        const event = await this.generateRandomEvent();
        if (event) {
          console.log(`🎲 랜덤 이벤트 생성: ${event.title}`);
        }
      } catch (error) {
        console.error('랜덤 이벤트 생성 오류:', error);
      }
    }, intervalHours * 60 * 60 * 1000);
  }
}

module.exports = EventService;

