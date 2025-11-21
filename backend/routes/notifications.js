const express = require('express');
const router = express.Router();
const NotificationService = require('../services/notificationService');
const AuthService = require('../services/authService');
const pool = require('../database/pool');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '인증 토큰이 필요합니다.' });
  }

  const decoded = AuthService.verifyToken(token);
  if (!decoded) {
    return res.status(403).json({ error: '유효하지 않은 토큰입니다.' });
  }

  // 사용자 정보를 req.user에 추가
  const conn = await pool.getConnection();
  try {
    const users = await conn.query('SELECT * FROM users WHERE id = ?', [decoded.id]);
    if (users.length === 0) {
      return res.status(403).json({ error: '사용자를 찾을 수 없습니다.' });
    }
    req.user = users[0];
    next();
  } catch (error) {
    console.error('인증 처리 오류:', error);
    return res.status(500).json({ error: '인증 처리 중 오류가 발생했습니다.' });
  } finally {
    conn.release();
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

