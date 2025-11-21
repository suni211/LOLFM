const pool = require('../database/pool');

class ScoutService {
  // 스카우트 생성
  static async createScout(teamId, name, level = 1) {
    let conn;
    try {
      conn = await pool.getConnection();
      
      const discoveryRate = 10 + (level - 1) * 5; // 레벨당 5% 증가
      const cost = 1000000 * level; // 레벨당 100만원
      
      const result = await conn.query(
        `INSERT INTO scouts (team_id, name, level, discovery_rate, cost_per_scout, status)
         VALUES (?, ?, ?, ?, ?, 'ACTIVE')`,
        [teamId, name, level, discoveryRate, cost]
      );
      
      return result.insertId;
    } catch (error) {
      console.error('스카우트 생성 오류:', error);
      throw error;
    } finally {
      if (conn) conn.release();
    }
  }
  
  // 스카우트 실행 (선수 발견)
  static async runScout(scoutId, position = null) {
    let conn;
    try {
      conn = await pool.getConnection();
      await conn.beginTransaction();
      
      // 스카우트 정보 조회
      const scoutRows = await conn.query('SELECT * FROM scouts WHERE id = ?', [scoutId]);
      const scouts = Array.isArray(scoutRows) && scoutRows.length > 0 ? scoutRows : [];
      
      if (!scouts || scouts.length === 0) {
        await conn.rollback();
        throw new Error('스카우트를 찾을 수 없습니다.');
      }
      
      const scout = scouts[0];
      if (!scout || !scout.team_id) {
        await conn.rollback();
        throw new Error('스카우트 정보가 올바르지 않습니다.');
      }
      
      // 팀 자금 확인
      const teamRows = await conn.query('SELECT money FROM teams WHERE id = ?', [scout.team_id]);
      const teams = Array.isArray(teamRows) && teamRows.length > 0 ? teamRows : [];
      
      if (!teams || teams.length === 0) {
        await conn.rollback();
        throw new Error('팀을 찾을 수 없습니다.');
      }
      
      const team = teams[0];
      const cost = Number(scout.cost_per_scout);
      const currentMoney = Number(team.money);
      
      if (currentMoney < cost) {
        await conn.rollback();
        throw new Error('자금이 부족합니다.');
      }
      
      // 스카우트 비용 차감
      const newMoney = currentMoney - cost;
      await conn.query(
        'UPDATE teams SET money = ? WHERE id = ?',
        [newMoney, scout.team_id]
      );
      
      // 재무 기록 추가
      try {
        await conn.query(
          `INSERT INTO financial_records (team_id, type, category, amount, description, record_date)
           VALUES (?, 'EXPENSE', 'SCOUT', ?, ?, CURDATE())`,
          [scout.team_id, cost, `스카우트 실행: ${scout.name || '스카우트'} (레벨 ${scout.level || 1})`]
        );
      } catch (recordError) {
        // financial_records 테이블이 없거나 오류가 발생해도 계속 진행
        console.warn('재무 기록 추가 실패:', recordError.message);
      }
      
      // 선수 발견 확률 계산
      const discoveryChance = Number(scout.discovery_rate) / 100;
      const found = Math.random() < discoveryChance;
      
      if (!found) {
        await conn.commit();
        return {
          success: false,
          message: '스카우트가 선수를 발견하지 못했습니다.',
          cost: cost,
          newBalance: newMoney
        };
      }
      
      // 선수 발견 (팀이 없는 선수 중 랜덤)
      let query = `
        SELECT * FROM players 
        WHERE team_id IS NULL 
        AND is_ai = TRUE
      `;
      const params = [];
      
      if (position) {
        query += ' AND position = ?';
        params.push(position);
      }
      
      query += ' ORDER BY RAND() LIMIT 1';
      
      const playerRows = await conn.query(query, params);
      const players = Array.isArray(playerRows) && playerRows.length > 0 ? playerRows : [];
      
      if (!players || players.length === 0) {
        return {
          success: false,
          message: '발견할 수 있는 선수가 없습니다.',
          cost: scout.cost_per_scout
        };
      }
      
      const player = players[0];
      if (!player) {
        return {
          success: false,
          message: '발견할 수 있는 선수가 없습니다.',
          cost: scout.cost_per_scout
        };
      }
      
      // 스카우트 결과 저장
      await conn.query(
        `INSERT INTO scout_results (scout_id, team_id, player_id, status)
         VALUES (?, ?, ?, 'NEW')`,
        [scoutId, scout.team_id, player.id]
      );
      
      await conn.commit();
      
      return {
        success: true,
        message: '새로운 선수를 발견했습니다!',
        player: {
          id: player.id,
          name: player.name,
          position: player.position,
          nationality: player.nationality,
          age: player.age,
          overall: player.overall,
          mental: player.mental,
          teamfight: player.teamfight,
          laning: player.laning,
          jungling: player.jungling,
          cs_skill: player.cs_skill,
          condition: player.condition,
          leadership: player.leadership
        },
        cost: cost,
        newBalance: newMoney
      };
    } catch (error) {
      console.error('스카우트 실행 오류:', error);
      if (conn) {
        try {
          await conn.rollback();
        } catch (rollbackError) {
          console.error('롤백 오류:', rollbackError);
        }
      }
      throw error;
    } finally {
      if (conn) conn.release();
    }
  }
  
  // 팀의 스카우트 목록 조회
  static async getTeamScouts(teamId) {
    let conn;
    try {
      conn = await pool.getConnection();
      
      const scouts = await conn.query(
        'SELECT * FROM scouts WHERE team_id = ? ORDER BY level DESC, created_at DESC',
        [teamId]
      );
      
      return scouts;
    } catch (error) {
      console.error('스카우트 목록 조회 오류:', error);
      return [];
    } finally {
      if (conn) conn.release();
    }
  }
  
  // 스카우트 결과 조회
  static async getScoutResults(teamId, limit = 20) {
    let conn;
    try {
      conn = await pool.getConnection();
      
      const results = await conn.query(
        `SELECT sr.*, p.name as player_name, p.position, p.nationality, p.age, 
         p.overall, p.mental, p.teamfight, p.laning, p.jungling, p.cs_skill,
         p.condition, p.leadership, s.name as scout_name, s.level as scout_level
         FROM scout_results sr
         LEFT JOIN players p ON sr.player_id = p.id
         LEFT JOIN scouts s ON sr.scout_id = s.id
         WHERE sr.team_id = ?
         ORDER BY sr.discovered_at DESC
         LIMIT ?`,
        [teamId, limit]
      );
      
      return results;
    } catch (error) {
      console.error('스카우트 결과 조회 오류:', error);
      return [];
    } finally {
      if (conn) conn.release();
    }
  }
}

module.exports = ScoutService;

