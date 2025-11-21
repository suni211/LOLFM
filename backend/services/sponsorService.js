const pool = require('../database/pool');

class SponsorService {
  // 사용 가능한 스폰서 조회
  static async getAvailableSponsors(teamId) {
    let conn;
    try {
      conn = await pool.getConnection();
      
      // 팀 정보 조회
      const [team] = await conn.query(
        'SELECT * FROM teams WHERE id = ?',
        [teamId]
      );
      
      if (!team) {
        throw new Error('팀을 찾을 수 없습니다.');
      }
      
      // 팀의 조건에 맞는 스폰서 조회
      const sponsors = await conn.query(
        `SELECT * FROM sponsors 
         WHERE min_awareness <= ? 
         AND min_reputation <= ? 
         AND min_fans <= ?
         ORDER BY rating DESC`,
        [team.awareness, team.reputation, team.fans]
      );
      
      return sponsors;
    } catch (error) {
      console.error('스폰서 조회 오류:', error);
      throw error;
    } finally {
      if (conn) conn.release();
    }
  }
  
  // 스폰서 계약
  static async contractSponsor(teamId, sponsorId) {
    let conn;
    try {
      conn = await pool.getConnection();
      
      // 기존 스폰서 확인
      const existingContracts = await conn.query(
        'SELECT * FROM team_sponsors WHERE team_id = ? AND status = \'active\'',
        [teamId]
      );
      
      if (existingContracts.length > 0) {
        throw new Error('이미 계약 중인 스폰서가 있습니다.');
      }
      
      // 스폰서 정보 조회
      const [sponsor] = await conn.query(
        'SELECT * FROM sponsors WHERE id = ?',
        [sponsorId]
      );
      
      if (!sponsor) {
        throw new Error('스폰서를 찾을 수 없습니다.');
      }
      
      // 계약 생성
      await conn.query(
        `INSERT INTO team_sponsors (team_id, sponsor_id, start_date, end_date, status)
         VALUES (?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR), 'active')`,
        [teamId, sponsorId]
      );
      
      console.log(`스폰서 계약 완료: ${teamId} - ${sponsorId}`);
      
      return { success: true, sponsor };
    } catch (error) {
      console.error('스폰서 계약 오류:', error);
      throw error;
    } finally {
      if (conn) conn.release();
    }
  }
  
  // 월별 스폰서 후원금 지급
  static async processMonthlySponsorship() {
    let conn;
    try {
      conn = await pool.getConnection();
      
      // 활성 스폰서 계약 조회
      const contracts = await conn.query(
        `SELECT ts.*, s.monthly_support, s.name as sponsor_name, t.id as team_id
         FROM team_sponsors ts
         JOIN sponsors s ON ts.sponsor_id = s.id
         JOIN teams t ON ts.team_id = t.id
         WHERE ts.status = 'active'`
      );
      
      for (const contract of contracts) {
        // 후원금 지급
        await conn.query(
          'UPDATE teams SET money = money + ? WHERE id = ?',
          [contract.monthly_support, contract.team_id]
        );
        
        console.log(`스폰서 후원금 지급: ${contract.sponsor_name} -> 팀 ${contract.team_id} (${contract.monthly_support}원)`);
      }
      
      return { success: true, count: contracts.length };
    } catch (error) {
      console.error('스폰서 후원금 지급 오류:', error);
      throw error;
    } finally {
      if (conn) conn.release();
    }
  }
}

module.exports = SponsorService;
