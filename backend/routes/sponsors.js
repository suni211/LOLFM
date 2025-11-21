const express = require('express');
const router = express.Router();
const SponsorService = require('../services/sponsorService');
const pool = require('../database/pool');

// 현재 스폰서 조회
router.get('/current/:teamId', async (req, res) => {
  let conn;
  try {
    const { teamId } = req.params;
    conn = await pool.getConnection();
    
    // 팀 정보 조회
    const [team] = await conn.query('SELECT * FROM teams WHERE id = ?', [teamId]);
    
    if (!team) {
      return res.status(404).json({ error: '팀을 찾을 수 없습니다.' });
    }
    
    // 현재 활성 스폰서가 없으면 null 반환
    if (!team.current_sponsor_id) {
      return res.json(null);
    }
    
    // 스폰서 정보 조회 (실제 스폰서 테이블이 있다고 가정)
    // 임시로 더미 데이터 반환
    res.json({
      id: 1,
      name: '테스트 스폰서',
      rating: 3,
      monthly_support: 10000000,
      win_bonus: 5000000
    });
  } catch (error) {
    console.error('현재 스폰서 조회 오류:', error);
    res.status(500).json({ error: error.message });
  } finally {
    if (conn) conn.release();
  }
});

// 이용 가능한 스폰서 목록
router.get('/available/:teamId', async (req, res) => {
  let conn;
  try {
    const { teamId } = req.params;
    conn = await pool.getConnection();
    
    // 팀 정보 조회
    const [team] = await conn.query('SELECT * FROM teams WHERE id = ?', [teamId]);
    
    if (!team) {
      return res.status(404).json({ error: '팀을 찾을 수 없습니다.' });
    }
    
    // 임시로 더미 스폰서 데이터 반환
    const dummySponsors = [
      {
        id: 1,
        name: '박민준 컴퍼니',
        rating: 1,
        monthly_support: 5000000,
        win_bonus: 1000000,
        min_awareness: 0,
        min_reputation: 0,
        min_fans: 0
      },
      {
        id: 2,
        name: '데이르미나 CM',
        rating: 1,
        monthly_support: 4500000,
        win_bonus: 500000,
        min_awareness: 0,
        min_reputation: 0,
        min_fans: 0
      },
      {
        id: 3,
        name: '환성 그룹',
        rating: 2,
        monthly_support: 10000000,
        win_bonus: 2000000,
        min_awareness: 100,
        min_reputation: 50,
        min_fans: 10000
      },
      {
        id: 4,
        name: '구성미홍',
        rating: 1,
        monthly_support: 2000000,
        win_bonus: 1000000,
        min_awareness: 0,
        min_reputation: 0,
        min_fans: 0
      }
    ];
    
    res.json(dummySponsors);
  } catch (error) {
    console.error('스폰서 목록 조회 오류:', error);
    res.status(500).json({ error: error.message });
  } finally {
    if (conn) conn.release();
  }
});

// 스폰서 계약
router.post('/contract', async (req, res) => {
  let conn;
  try {
    const { teamId, sponsorId } = req.body;
    conn = await pool.getConnection();
    
    // 팀 정보 업데이트 (임시)
    await conn.query(
      'UPDATE teams SET current_sponsor_id = ? WHERE id = ?',
      [sponsorId, teamId]
    );
    
    res.json({ success: true, message: '스폰서 계약이 완료되었습니다.' });
  } catch (error) {
    console.error('스폰서 계약 오류:', error);
    res.status(500).json({ error: error.message });
  } finally {
    if (conn) conn.release();
  }
});

// 스폰서 계약 해지
router.post('/terminate', async (req, res) => {
  let conn;
  try {
    const { teamId } = req.body;
    conn = await pool.getConnection();
    
    await conn.query(
      'UPDATE teams SET current_sponsor_id = NULL WHERE id = ?',
      [teamId]
    );
    
    res.json({ success: true, message: '스폰서 계약이 해지되었습니다.' });
  } catch (error) {
    console.error('스폰서 해지 오류:', error);
    res.status(500).json({ error: error.message });
  } finally {
    if (conn) conn.release();
  }
});

module.exports = router;

