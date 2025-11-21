const express = require('express');
const router = express.Router();
const pool = require('../database/pool');

// 팀 통계 조회
router.get('/team/:teamId', async (req, res) => {
  let conn;
  try {
    const { teamId } = req.params;
    conn = await pool.getConnection();
    
    // 경기 통계
    const [stats] = await conn.query(
      `SELECT 
        COUNT(*) as total_matches,
        SUM(CASE WHEN (home_team_id = ? AND home_score > away_score) OR 
                      (away_team_id = ? AND away_score > home_score) THEN 1 ELSE 0 END) as wins,
        SUM(CASE WHEN home_score = away_score THEN 1 ELSE 0 END) as draws,
        SUM(CASE WHEN (home_team_id = ? AND home_score < away_score) OR 
                      (away_team_id = ? AND away_score < home_score) THEN 1 ELSE 0 END) as losses
       FROM matches
       WHERE (home_team_id = ? OR away_team_id = ?) AND status = 'completed'`,
      [teamId, teamId, teamId, teamId, teamId, teamId]
    );
    
    const total = stats.total_matches || 0;
    const wins = stats.wins || 0;
    const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;
    
    res.json({
      total_matches: total,
      wins: wins,
      draws: stats.draws || 0,
      losses: stats.losses || 0,
      win_rate: winRate
    });
  } catch (error) {
    console.error('팀 통계 조회 오류:', error);
    res.status(500).json({ error: '통계 조회 실패' });
  } finally {
    if (conn) conn.release();
  }
});

// 선수 통계 조회
router.get('/players/:teamId', async (req, res) => {
  let conn;
  try {
    const { teamId } = req.params;
    conn = await pool.getConnection();
    
    const players = await conn.query(
      `SELECT id, name, position FROM players WHERE team_id = ?`,
      [teamId]
    );
    
    // 임시 통계 (나중에 player_statistics 테이블에서 가져오기)
    const playerStats = players.map(player => ({
      id: player.id,
      name: player.name,
      position: player.position,
      matches_played: 0,
      win_rate: 0,
      average_rating: 0,
      kda: '0.0/0.0/0.0'
    }));
    
    res.json(playerStats);
  } catch (error) {
    console.error('선수 통계 조회 오류:', error);
    res.status(500).json({ error: '통계 조회 실패' });
  } finally {
    if (conn) conn.release();
  }
});

module.exports = router;

