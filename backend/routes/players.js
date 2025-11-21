const express = require('express');
const router = express.Router();
const pool = require('../database/pool');

// 프리 에이전트 선수 목록 조회 (포지션별)
router.get('/free-agents/:position', async (req, res) => {
  let conn;
  try {
    const { position } = req.params;
    conn = await pool.getConnection();
    
    // 팀에 소속되지 않은 선수 2명 조회
    const players = await conn.query(
      `SELECT * FROM players 
       WHERE team_id IS NULL 
       AND position = ? 
       AND is_ai = TRUE
       ORDER BY RAND()
       LIMIT 2`,
      [position]
    );
    
    res.json(players);
  } catch (error) {
    console.error('프리 에이전트 조회 오류:', error);
    res.status(500).json({ error: '선수 조회 실패' });
  } finally {
    if (conn) conn.release();
  }
});

// 팀 선수 목록 조회
router.get('/team/:teamId', async (req, res) => {
  let conn;
  try {
    const { teamId } = req.params;
    conn = await pool.getConnection();
    
    const players = await conn.query(
      'SELECT * FROM players WHERE team_id = ? ORDER BY position, overall DESC',
      [teamId]
    );
    
    res.json(players);
  } catch (error) {
    console.error('팀 선수 조회 오류:', error);
    res.status(500).json({ error: '선수 조회 실패' });
  } finally {
    if (conn) conn.release();
  }
});

// 선수 영입
router.post('/recruit', async (req, res) => {
  let conn;
  try {
    const { playerId, teamId } = req.body;
    
    conn = await pool.getConnection();
    
    // 선수 정보 조회
    const [player] = await conn.query(
      'SELECT * FROM players WHERE id = ?',
      [playerId]
    );
    
    if (!player || player.team_id) {
      return res.status(400).json({ error: '이미 소속된 선수이거나 존재하지 않습니다.' });
    }
    
    // 급여 계산 (overall에 따라)
    const salary = player.overall * 100000; // overall * 10만원
    
    // 선수에 팀 배정 및 급여 설정
    await conn.query(
      `UPDATE players 
       SET team_id = ?, salary = ?, contract_start = NOW(), contract_end = DATE_ADD(NOW(), INTERVAL 1 YEAR)
       WHERE id = ?`,
      [teamId, salary, playerId]
    );
    
    res.json({ success: true, player: { ...player, salary } });
  } catch (error) {
    console.error('선수 영입 오류:', error);
    res.status(500).json({ error: '선수 영입 실패' });
  } finally {
    if (conn) conn.release();
  }
});

// 커스텀 선수 생성
router.post('/custom', async (req, res) => {
  let conn;
  try {
    const { teamId, name, position, nationality } = req.body;
    
    conn = await pool.getConnection();
    
    // 커스텀 선수 생성
    const result = await conn.query(
      `INSERT INTO players (
        team_id, name, position, nationality, overall, potential,
        mental, teamfight, laning, jungling, cs_skill, \`condition\`,
        leadership, will, competitiveness, dirty_play,
        is_ai, is_custom, salary
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, FALSE, TRUE, ?)`,
      [
        teamId, name, position, nationality,
        45, // initial overall
        70, // potential
        50, 50, 50, 50, 50, 100, 50, 60, 60, 30,
        5000000 // 500만원
      ]
    );
    
    res.json({ success: true, playerId: result.insertId });
  } catch (error) {
    console.error('커스텀 선수 생성 오류:', error);
    res.status(500).json({ error: '선수 생성 실패' });
  } finally {
    if (conn) conn.release();
  }
});

module.exports = router;
