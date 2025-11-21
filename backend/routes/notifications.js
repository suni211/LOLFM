const express = require('express');
const router = express.Router();
const NotificationService = require('../services/notificationService');
const pool = require('../database/pool');

// 알림 조회
router.get('/', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: '인증 필요' });
    }

    const conn = await pool.getConnection();
    const notifications = await conn.query(
      `SELECT * FROM notifications 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT 50`,
      [req.user.id]
    );
    conn.release();
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 알림 읽음 처리
router.put('/:notificationId/read', async (req, res) => {
  try {
    const { notificationId } = req.params;
    const conn = await pool.getConnection();
    await conn.query(
      'UPDATE notifications SET is_read = TRUE WHERE id = ?',
      [notificationId]
    );
    conn.release();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

