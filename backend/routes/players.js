const express = require('express');
const router = express.Router();
const PlayerService = require('../services/playerService');
const pool = require('../database/pool');

// 선수 목록 조회
router.get('/team/:teamId', async (req, res) => {
  try {
    const { teamId } = req.params;
    const conn = await pool.getConnection();
    const players = await conn.query(
      'SELECT * FROM players WHERE team_id = ?',
      [teamId]
    );
    conn.release();
    res.json(players);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 선수 상세 정보
router.get('/:playerId', async (req, res) => {
  try {
    const { playerId } = req.params;
    const conn = await pool.getConnection();
    const players = await conn.query(
      'SELECT * FROM players WHERE id = ?',
      [playerId]
    );
    conn.release();
    res.json(players[0] || null);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 훈련 시작
router.post('/:playerId/training', async (req, res) => {
  try {
    const { playerId } = req.params;
    const { trainingType, focusStat } = req.body;
    const result = await PlayerService.startTraining(playerId, trainingType, focusStat);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 선수 성장 처리
router.post('/:playerId/growth', async (req, res) => {
  try {
    const { playerId } = req.params;
    const result = await PlayerService.processPlayerGrowth(playerId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 커스텀 선수 생성
router.post('/custom', async (req, res) => {
  try {
    const { teamId, name, nationality, position, stats, potential } = req.body;
    const conn = await pool.getConnection();
    
    // 팀당 커스텀 선수 1명만 가능
    const existing = await conn.query(
      'SELECT COUNT(*) as count FROM players WHERE team_id = ? AND is_custom = TRUE',
      [teamId]
    );
    
    if (existing[0].count > 0) {
      conn.release();
      return res.status(400).json({ error: '이미 커스텀 선수가 있습니다.' });
    }

    const result = await conn.query(
      `INSERT INTO players (name, nationality, position, team_id, is_custom, is_ai, 
        mental, teamfight, laning, jungling, cs_skill, \`condition\`, leadership, 
        will, competitiveness, dirty_play, potential, overall, age)
       VALUES (?, ?, ?, ?, TRUE, FALSE, ?, ?, ?, ?, ?, 50, ?, ?, ?, ?, ?, ?, 18)`,
      [
        name, nationality, position, teamId,
        stats.mental || 50, stats.teamfight || 50, stats.laning || 50,
        stats.jungling || 50, stats.cs_skill || 50,
        stats.leadership || 50, stats.will || 50,
        stats.competitiveness || 50, stats.dirty_play || 50,
        potential || 50, 50
      ]
    );

    conn.release();
    res.json({ success: true, playerId: result.insertId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

