const express = require('express');
const router = express.Router();
const FriendlyMatchService = require('../services/friendlyMatchService');
const pool = require('../database/pool');
const AuthService = require('../services/authService');

// JWT 인증 미들웨어
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

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
    return res.status(500).json({ error: '인증 처리 중 오류가 발생했습니다.' });
  } finally {
    conn.release();
  }
};

// 친선 경기 생성
router.post('/create', authenticateToken, async (req, res) => {
  let conn;
  try {
    const { team1Id, team2Id, matchDate } = req.body;
    const userId = req.user.id;
    
    if (!team1Id || !team2Id || !matchDate) {
      return res.status(400).json({ error: '필수 정보가 누락되었습니다.' });
    }
    
    // 팀 소유권 확인
    conn = await pool.getConnection();
    const [team1] = await conn.query('SELECT * FROM teams WHERE id = ? AND user_id = ?', [team1Id, userId]);
    conn.release();
    
    if (!team1 || team1.length === 0) {
      return res.status(403).json({ error: '팀 소유권이 없습니다.' });
    }
    
    const result = await FriendlyMatchService.createFriendlyMatch(team1Id, team2Id, matchDate);
    res.json(result);
  } catch (error) {
    console.error('친선 경기 생성 오류:', error);
    res.status(500).json({ error: error.message || '친선 경기 생성 실패' });
  }
});

// 친선 경기 시뮬레이션
router.post('/:matchId/simulate', authenticateToken, async (req, res) => {
  try {
    const { matchId } = req.params;
    const result = await FriendlyMatchService.simulateFriendlyMatch(matchId);
    res.json(result);
  } catch (error) {
    console.error('친선 경기 시뮬레이션 오류:', error);
    res.status(500).json({ error: error.message || '친선 경기 시뮬레이션 실패' });
  }
});

// 친선 경기 가능한 상대팀 목록 조회
router.get('/opponents/:teamId', authenticateToken, async (req, res) => {
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
    
    const opponents = await FriendlyMatchService.getAvailableOpponents(teamId);
    res.json(opponents);
  } catch (error) {
    console.error('상대팀 조회 오류:', error);
    res.status(500).json({ error: error.message || '상대팀 조회 실패' });
  }
});

// 팀의 친선 경기 목록 조회
router.get('/team/:teamId', authenticateToken, async (req, res) => {
  try {
    const { teamId } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    const matches = await FriendlyMatchService.getTeamFriendlyMatches(teamId, limit);
    res.json(matches);
  } catch (error) {
    console.error('친선 경기 목록 조회 오류:', error);
    res.status(500).json({ error: '친선 경기 목록 조회 실패' });
  }
});

module.exports = router;

