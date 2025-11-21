const express = require('express');
const router = express.Router();
const ScoutService = require('../services/scoutService');
const pool = require('../database/pool');
const AuthService = require('../services/authService');

// JWT 인증 미들웨어
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

  const conn = await pool.getConnection();
  try {
    const users = await conn.query('SELECT * FROM users WHERE id = ?', [decoded.id]);
    if (users.length === 0) {
      return res.status(403).json({ error: '사용자를 찾을 수 없습니다.' });
    }
    req.user = users[0];
    next();
  } catch (error) {
    return res.status(500).json({ error: '인증 처리 중 오류가 발생했습니다.' });
  } finally {
    conn.release();
  }
};

// 스카우트 생성
router.post('/create', authenticateToken, async (req, res) => {
  try {
    const { teamId, name, level } = req.body;
    const userId = req.user.id;
    
    // 팀 소유권 확인
    const conn = await pool.getConnection();
    const [team] = await conn.query('SELECT * FROM teams WHERE id = ? AND user_id = ?', [teamId, userId]);
    conn.release();
    
    if (!team || team.length === 0) {
      return res.status(403).json({ error: '팀 소유권이 없습니다.' });
    }
    
    const scoutId = await ScoutService.createScout(teamId, name, level || 1);
    res.json({ success: true, scoutId, message: '스카우트가 생성되었습니다.' });
  } catch (error) {
    console.error('스카우트 생성 오류:', error);
    res.status(500).json({ error: error.message || '스카우트 생성 실패' });
  }
});

// 스카우트 실행
router.post('/:scoutId/run', authenticateToken, async (req, res) => {
  try {
    const { scoutId } = req.params;
    const { position } = req.body;
    
    // 스카우트 소유권 확인
    const conn = await pool.getConnection();
    const scouts = await conn.query(
      `SELECT s.*, t.user_id 
       FROM scouts s 
       JOIN teams t ON s.team_id = t.id 
       WHERE s.id = ?`,
      [scoutId]
    );
    conn.release();
    
    if (!scouts || scouts.length === 0) {
      return res.status(404).json({ error: '스카우트를 찾을 수 없습니다.' });
    }
    
    const scout = scouts[0];
    if (!scout || scout.user_id !== req.user.id) {
      return res.status(403).json({ error: '스카우트 소유권이 없습니다.' });
    }
    
    const result = await ScoutService.runScout(scoutId, position);
    res.json(result);
  } catch (error) {
    console.error('스카우트 실행 오류:', error);
    res.status(500).json({ error: error.message || '스카우트 실행 실패' });
  }
});

// 팀의 스카우트 목록 조회
router.get('/team/:teamId', authenticateToken, async (req, res) => {
  try {
    const { teamId } = req.params;
    const userId = req.user.id;
    
    // 팀 소유권 확인
    const conn = await pool.getConnection();
    const [team] = await conn.query('SELECT * FROM teams WHERE id = ? AND user_id = ?', [teamId, userId]);
    conn.release();
    
    if (!team || team.length === 0) {
      return res.status(403).json({ error: '팀 소유권이 없습니다.' });
    }
    
    const scouts = await ScoutService.getTeamScouts(teamId);
    res.json(scouts);
  } catch (error) {
    console.error('스카우트 목록 조회 오류:', error);
    res.status(500).json({ error: '스카우트 목록 조회 실패' });
  }
});

// 스카우트 결과 조회
router.get('/results/:teamId', authenticateToken, async (req, res) => {
  try {
    const { teamId } = req.params;
    const limit = parseInt(req.query.limit) || 20;
    const userId = req.user.id;
    
    // 팀 소유권 확인
    const conn = await pool.getConnection();
    const [team] = await conn.query('SELECT * FROM teams WHERE id = ? AND user_id = ?', [teamId, userId]);
    conn.release();
    
    if (!team || team.length === 0) {
      return res.status(403).json({ error: '팀 소유권이 없습니다.' });
    }
    
    const results = await ScoutService.getScoutResults(teamId, limit);
    res.json(results);
  } catch (error) {
    console.error('스카우트 결과 조회 오류:', error);
    res.status(500).json({ error: '스카우트 결과 조회 실패' });
  }
});

module.exports = router;

