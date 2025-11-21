const express = require('express');
const router = express.Router();
const pool = require('../database/pool');

// 지역별 리그 조회
router.get('/region/:regionId', async (req, res) => {
  let conn;
  try {
    const { regionId } = req.params;
    conn = await pool.getConnection();
    
    const leagues = await conn.query(`
      SELECT 
        l.*,
        (SELECT COUNT(*) FROM teams WHERE league_id = l.id) as current_teams
      FROM leagues l
      WHERE l.region_id = ?
      ORDER BY l.division
    `, [regionId]);
    
    res.json(leagues);
  } catch (error) {
    console.error('리그 조회 오류:', error);
    res.status(500).json({ error: '리그 조회 실패' });
  } finally {
    if (conn) conn.release();
  }
});

// 특정 리그 정보 조회
router.get('/:leagueId', async (req, res) => {
  let conn;
  try {
    const { leagueId } = req.params;
    conn = await pool.getConnection();
    
    const [league] = await conn.query(
      'SELECT * FROM leagues WHERE id = ?',
      [leagueId]
    );
    
    if (!league) {
      return res.status(404).json({ error: '리그를 찾을 수 없습니다' });
    }
    
    res.json(league);
  } catch (error) {
    console.error('리그 조회 오류:', error);
    res.status(500).json({ error: '리그 조회 실패' });
  } finally {
    if (conn) conn.release();
  }
});

module.exports = router;

