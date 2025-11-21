const express = require('express');
const router = express.Router();
const pool = require('../database/pool');

// 지역별 리그 조회
router.get('/region/:regionId', async (req, res) => {
  let conn;
  try {
    const { regionId } = req.params;
    conn = await pool.getConnection();
    
    // 먼저 리그 정보 조회
    const leagues = await conn.query(
      'SELECT * FROM leagues WHERE region_id = ? ORDER BY division',
      [regionId]
    );
    
    // 각 리그의 현재 팀 수 조회
    for (let league of leagues) {
      const teamCount = await conn.query(
        'SELECT COUNT(*) as count FROM teams WHERE league_id = ?',
        [league.id]
      );
      league.current_teams = teamCount[0]?.count || 0;
    }
    
    console.log('리그 조회 결과:', leagues);
    res.json(leagues);
  } catch (error) {
    console.error('리그 조회 오류:', error);
    res.status(500).json({ error: '리그 조회 실패', details: error.message });
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

