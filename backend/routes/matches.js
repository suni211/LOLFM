const express = require('express');
const router = express.Router();
const MatchService = require('../services/matchService');
const pool = require('../database/pool');

// 경기 시뮬레이션
router.post('/:matchId/simulate', async (req, res) => {
  try {
    const { matchId } = req.params;
    const result = await MatchService.simulateMatch(matchId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 경기 목록 조회
router.get('/team/:teamId', async (req, res) => {
  try {
    const { teamId } = req.params;
    const conn = await pool.getConnection();
    const matches = await conn.query(
      `SELECT m.*, 
       ht.name as home_team_name, 
       at.name as away_team_name
       FROM matches m
       JOIN teams ht ON m.home_team_id = ht.id
       JOIN teams at ON m.away_team_id = at.id
       WHERE m.home_team_id = ? OR m.away_team_id = ?
       ORDER BY m.match_date DESC
       LIMIT 20`,
      [teamId, teamId]
    );
    conn.release();
    res.json(matches);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 리그 순위 조회
router.get('/league/:leagueId/standings', async (req, res) => {
  try {
    const { leagueId } = req.params;
    const conn = await pool.getConnection();
    const gameTime = await conn.query('SELECT `current_year` FROM game_time WHERE id = 1');
    const seasonYear = gameTime[0]?.current_year || 2024;
    
    const standings = await conn.query(
      `SELECT ls.*, t.name as team_name
       FROM league_standings ls
       JOIN teams t ON ls.team_id = t.id
       WHERE ls.league_id = ? AND ls.season_year = ?
       ORDER BY ls.rank ASC`,
      [leagueId, seasonYear]
    );
    conn.release();
    res.json(standings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

