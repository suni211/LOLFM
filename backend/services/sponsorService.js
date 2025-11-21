const pool = require('../database/pool');

/**
 * 스폰서 시스템 서비스
 */
class SponsorService {
  // 스폰서 생성 (인지도 기반)
  static generateSponsors() {
    return {
      1: [
        { name: '박민준 컴퍼니', monthlySupport: 5000000, winBonus: 0 },
        { name: '데이르미나 CM', monthlySupport: 4500000, winBonus: 0 },
        { name: '환성', monthlySupport: 10000000, winBonus: 0 },
        { name: '구성미홍', monthlySupport: 2000000, winBonus: 1000000 }
      ],
      2: [
        { name: '테크노글로벌', monthlySupport: 15000000, winBonus: 2000000 },
        { name: '게이밍월드', monthlySupport: 12000000, winBonus: 1500000 },
        { name: '스포츠넷', monthlySupport: 18000000, winBonus: 2500000 }
      ],
      3: [
        { name: '엘리트스포츠', monthlySupport: 30000000, winBonus: 5000000, equipment: true },
        { name: '챔피언스그룹', monthlySupport: 25000000, winBonus: 4000000, equipment: true },
        { name: '프로게이밍코리아', monthlySupport: 35000000, winBonus: 6000000, equipment: true }
      ],
      4: [
        { name: '글로벌게이밍', monthlySupport: 50000000, winBonus: 10000000, equipment: true, awarenessBonus: 10 },
        { name: '월드챔피언스', monthlySupport: 60000000, winBonus: 12000000, equipment: true, awarenessBonus: 15 },
        { name: '엘리트리그', monthlySupport: 55000000, winBonus: 11000000, equipment: true, awarenessBonus: 12 }
      ],
      5: [
        { name: '레전드스포츠', monthlySupport: 100000000, winBonus: 20000000, equipment: true, awarenessBonus: 25, fanBonus: 500 },
        { name: '월드게이밍엠파이어', monthlySupport: 120000000, winBonus: 25000000, equipment: true, awarenessBonus: 30, fanBonus: 600 },
        { name: '챔피언스엠파이어', monthlySupport: 150000000, winBonus: 30000000, equipment: true, awarenessBonus: 35, fanBonus: 800 }
      ]
    };
  }

  // 스폰서 제안 (인지도 기반)
  static async offerSponsor(teamId) {
    const conn = await pool.getConnection();
    try {
      const team = await conn.query(
        'SELECT awareness, reputation, fans FROM teams WHERE id = ?',
        [teamId]
      );

      if (team.length === 0) return null;

      const t = team[0];
      
      // 인지도 기반 스폰서 등급 결정
      let maxRating = 1;
      if (t.awareness >= 1000) maxRating = 5;
      else if (t.awareness >= 500) maxRating = 4;
      else if (t.awareness >= 200) maxRating = 3;
      else if (t.awareness >= 50) maxRating = 2;

      const sponsors = this.generateSponsors();
      const availableSponsors = [];
      
      for (let rating = 1; rating <= maxRating; rating++) {
        availableSponsors.push(...sponsors[rating].map(s => ({ ...s, rating })));
      }

      // 랜덤 선택
      const selected = availableSponsors[Math.floor(Math.random() * availableSponsors.length)];
      
      return {
        name: selected.name,
        rating: selected.rating,
        monthlySupport: selected.monthlySupport,
        winBonus: selected.winBonus,
        equipment: selected.equipment || false,
        awarenessBonus: selected.awarenessBonus || 0,
        fanBonus: selected.fanBonus || 0
      };
    } finally {
      conn.release();
    }
  }

  // 스폰서 계약
  static async contractSponsor(teamId, sponsorData) {
    const conn = await pool.getConnection();
    try {
      const contractStart = new Date();
      const contractEnd = new Date();
      contractEnd.setFullYear(contractEnd.getFullYear() + 1); // 1년 계약

      await conn.query(
        `INSERT INTO sponsors (team_id, name, star_rating, monthly_support, win_bonus, contract_start, contract_end)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [teamId, sponsorData.name, sponsorData.rating, sponsorData.monthlySupport, 
         sponsorData.winBonus, contractStart, contractEnd]
      );

      // 인지도 보너스 적용
      if (sponsorData.awarenessBonus > 0) {
        await conn.query(
          'UPDATE teams SET awareness = awareness + ? WHERE id = ?',
          [sponsorData.awarenessBonus, teamId]
        );
      }

      // 팬 보너스 적용
      if (sponsorData.fanBonus > 0) {
        await conn.query(
          'UPDATE teams SET fans = fans + ? WHERE id = ?',
          [sponsorData.fanBonus, teamId]
        );
      }

      return { success: true };
    } finally {
      conn.release();
    }
  }

  // 월별 스폰서 지원금 지급
  static async processMonthlySponsorPayments(teamId) {
    const conn = await pool.getConnection();
    try {
      const sponsors = await conn.query(
        'SELECT * FROM sponsors WHERE team_id = ? AND CURDATE() BETWEEN contract_start AND contract_end',
        [teamId]
      );

      let totalSupport = 0;
      for (const sponsor of sponsors) {
        totalSupport += sponsor.monthly_support || 0;
      }

      if (totalSupport > 0) {
        await conn.query(
          'UPDATE teams SET money = money + ? WHERE id = ?',
          [totalSupport, teamId]
        );

        await conn.query(
          `INSERT INTO financial_records (team_id, type, category, amount, description, record_date)
           VALUES (?, 'INCOME', 'SPONSOR', ?, ?, CURDATE())`,
          [teamId, totalSupport, `스폰서 지원금`]
        );
      }

      return totalSupport;
    } finally {
      conn.release();
    }
  }

  // 승리 보너스 지급
  static async processWinBonus(teamId) {
    const conn = await pool.getConnection();
    try {
      const sponsors = await conn.query(
        'SELECT win_bonus FROM sponsors WHERE team_id = ? AND CURDATE() BETWEEN contract_start AND contract_end',
        [teamId]
      );

      let totalBonus = 0;
      sponsors.forEach(s => {
        totalBonus += s.win_bonus || 0;
      });

      if (totalBonus > 0) {
        await conn.query(
          'UPDATE teams SET money = money + ? WHERE id = ?',
          [totalBonus, teamId]
        );

        await conn.query(
          `INSERT INTO financial_records (team_id, type, category, amount, description, record_date)
           VALUES (?, 'INCOME', 'SPONSOR_WIN_BONUS', ?, ?, CURDATE())`,
          [teamId, totalBonus, `승리 보너스`]
        );
      }

      return totalBonus;
    } finally {
      conn.release();
    }
  }
}

module.exports = SponsorService;

