const express = require('express');
const router = express.Router();
const EventService = require('../services/eventService');
const pool = require('../database/pool');

// 랜덤 이벤트 생성
router.post('/generate', async (req, res) => {
  try {
    const { teamId } = req.body;
    const event = await EventService.generateRandomEvent(teamId);
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 이벤트 처리
router.post('/:eventId/process', async (req, res) => {
  try {
    const { eventId } = req.params;
    const result = await EventService.processEvent(eventId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 미처리 이벤트 조회
router.get('/team/:teamId/pending', async (req, res) => {
  try {
    const { teamId } = req.params;
    const conn = await pool.getConnection();
    const events = await conn.query(
      'SELECT * FROM random_events WHERE team_id = ? AND is_processed = FALSE ORDER BY event_date DESC',
      [teamId]
    );
    conn.release();
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

