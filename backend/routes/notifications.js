const express = require('express');
const router = express.Router();
const NotificationService = require('../services/notificationService');
const pool = require('../database/pool');

// 인증 미들웨어 (server.js에서 가져오기)
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '인증 토큰이 필요합니다.' });
  }

  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: '유효하지 않은 토큰입니다.' });
  }
};

// 알림 조회
router.get('/', authenticateToken, async (req, res) => {
  try {
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
    console.error('알림 조회 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 알림 읽음 처리
router.put('/:notificationId/read', authenticateToken, async (req, res) => {
  try {
    const { notificationId } = req.params;
    const conn = await pool.getConnection();
    await conn.query(
      'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
      [notificationId, req.user.id]
    );
    conn.release();
    res.json({ success: true });
  } catch (error) {
    console.error('알림 읽음 처리 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

