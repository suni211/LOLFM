const express = require('express');
const router = express.Router();
const pool = require('../database/pool');

// 모든 지역 조회
router.get('/', async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const regions = await conn.query('SELECT * FROM regions ORDER BY id');
    res.json(regions);
  } catch (error) {
    console.error('지역 조회 오류:', error);
    res.status(500).json({ error: '지역 조회 실패' });
  } finally {
    if (conn) conn.release();
  }
});

// 특정 지역의 리그 조회
router.get('/:regionId/leagues', async (req, res) => {
  let conn;
  try {
    const { regionId } = req.params;
    conn = await pool.getConnection();
    const leagues = await conn.query(
      'SELECT * FROM leagues WHERE region_id = ? ORDER BY division',
      [regionId]
    );
    res.json(leagues);
  } catch (error) {
    console.error('리그 조회 오류:', error);
    res.status(500).json({ error: '리그 조회 실패' });
  } finally {
    if (conn) conn.release();
  }
});

module.exports = router;

