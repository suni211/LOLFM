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
    console.error('경기 시뮬레이션 오류:', error);
    res.status(500).json({ error: error.message || '경기 시뮬레이션 실패' });
  }
});

// 경기 목록 조회 (팀별)
router.get('/team/:teamId', async (req, res) => {
  try {
    const { teamId } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    const matches = await MatchService.getTeamMatches(teamId, limit);
    res.json(matches);
  } catch (error) {
    console.error('경기 목록 조회 오류:', error);
    res.status(500).json({ error: '경기 목록 조회 실패' });
  }
});

// 오늘의 경기 조회
router.get('/today/:teamId', async (req, res) => {
  let conn;
  try {
    const { teamId } = req.params;
    conn = await pool.getConnection();
    
    // 게임 시간 조회
    const [gameTime] = await conn.query('SELECT * FROM game_time WHERE id = 1');
    const currentDate = gameTime.current_date || new Date();
    const dateStr = typeof currentDate === 'string' ? currentDate.split('T')[0] : currentDate.toISOString().split('T')[0];
    
    // 오늘 예정된 경기 조회
    const matches = await conn.query(
      `SELECT m.*, 
       ht.name as home_team_name, ht.logo_path as home_team_logo,
       at.name as away_team_name, at.logo_path as away_team_logo
       FROM matches m
       JOIN teams ht ON m.home_team_id = ht.id
       JOIN teams at ON m.away_team_id = at.id
       WHERE DATE(m.match_date) = ? 
       AND (m.home_team_id = ? OR m.away_team_id = ?)
       AND m.status = 'scheduled'
       ORDER BY m.match_date ASC`,
      [dateStr, teamId, teamId]
    );
    
    res.json(matches);
  } catch (error) {
    console.error('오늘의 경기 조회 오류:', error);
    res.status(500).json({ error: '경기 조회 실패' });
  } finally {
    if (conn) conn.release();
  }
});

// 경기 상세 정보 조회
router.get('/:matchId', async (req, res) => {
  let conn;
  try {
    const { matchId } = req.params;
    conn = await pool.getConnection();
    
    const [matches] = await conn.query(
      `SELECT m.*, 
       ht.name as home_team_name, ht.logo_path as home_team_logo, ht.id as home_team_id,
       at.name as away_team_name, at.logo_path as away_team_logo, at.id as away_team_id,
       l.name as league_name
       FROM matches m
       JOIN teams ht ON m.home_team_id = ht.id
       JOIN teams at ON m.away_team_id = at.id
       LEFT JOIN leagues l ON m.league_id = l.id
       WHERE m.id = ?`,
      [matchId]
    );
    
    if (!matches || matches.length === 0) {
      return res.status(404).json({ error: '경기를 찾을 수 없습니다.' });
    }
    
    res.json(matches[0]);
  } catch (error) {
    console.error('경기 상세 조회 오류:', error);
    res.status(500).json({ error: '경기 조회 실패' });
  } finally {
    if (conn) conn.release();
  }
});

// 경기 관전 (시뮬레이션 + 결과 반환)
router.get('/:matchId/watch', async (req, res) => {
  try {
    const { matchId } = req.params;
    
    // 경기 정보 조회
    let conn = await pool.getConnection();
    const [matches] = await conn.query('SELECT * FROM matches WHERE id = ?', [matchId]);
    conn.release();
    
    if (!matches || matches.length === 0) {
      return res.status(404).json({ error: '경기를 찾을 수 없습니다.' });
    }
    
    const match = matches[0];
    
    // 아직 진행되지 않은 경기면 시뮬레이션
    if (match.status === 'scheduled') {
      const result = await MatchService.simulateMatch(matchId);
      
      // 경기 상세 정보 다시 조회
      conn = await pool.getConnection();
      const [updatedMatches] = await conn.query(
        `SELECT m.*, 
         ht.name as home_team_name, ht.logo_path as home_team_logo,
         at.name as away_team_name, at.logo_path as away_team_logo,
         l.name as league_name
         FROM matches m
         JOIN teams ht ON m.home_team_id = ht.id
         JOIN teams at ON m.away_team_id = at.id
         LEFT JOIN leagues l ON m.league_id = l.id
         WHERE m.id = ?`,
        [matchId]
      );
      conn.release();
      
      return res.json({
        ...updatedMatches[0],
        simulation: result
      });
    }
    
    // 이미 완료된 경기
    conn = await pool.getConnection();
    const [completedMatches] = await conn.query(
      `SELECT m.*, 
       ht.name as home_team_name, ht.logo_path as home_team_logo,
       at.name as away_team_name, at.logo_path as away_team_logo,
       l.name as league_name
       FROM matches m
       JOIN teams ht ON m.home_team_id = ht.id
       JOIN teams at ON m.away_team_id = at.id
       LEFT JOIN leagues l ON m.league_id = l.id
       WHERE m.id = ?`,
      [matchId]
    );
    conn.release();
    
    res.json(completedMatches[0]);
  } catch (error) {
    console.error('경기 관전 오류:', error);
    res.status(500).json({ error: error.message || '경기 관전 실패' });
  }
});

// 리그 순위 조회
router.get('/league/:leagueId/standings', async (req, res) => {
  let conn;
  try {
    const { leagueId } = req.params;
    conn = await pool.getConnection();
    const [gameTime] = await conn.query('SELECT `current_year` FROM game_time WHERE id = 1');
    const seasonYear = gameTime.current_year || 2024;
    
    // 리그에 소속된 모든 팀 조회
    const allTeams = await conn.query(
      `SELECT id, name, logo_path, is_ai FROM teams WHERE league_id = ?`,
      [leagueId]
    );
    
    // 순위 데이터 조회
    let standingsData = [];
    try {
      standingsData = await conn.query(
        `SELECT ls.*, t.name as team_name, t.logo_path as team_logo, t.is_ai
         FROM league_standings ls
         JOIN teams t ON ls.team_id = t.id
         WHERE ls.league_id = ? AND ls.season_year = ?`,
        [leagueId, seasonYear]
      );
    } catch (error) {
      console.log('순위 데이터 조회 오류 (계속 진행):', error);
    }
    
    // 순위 데이터가 없는 팀들을 초기화
    const standingsMap = new Map();
    standingsData.forEach(standing => {
      standingsMap.set(standing.team_id, standing);
    });
    
    // 모든 팀에 대해 순위 데이터 생성 (없으면 초기값)
    const allStandings = allTeams.map(team => {
      const existing = standingsMap.get(team.id);
      if (existing) {
        return {
          ...existing,
          team_name: team.name,
          team_logo: team.logo_path,
          is_ai: team.is_ai
        };
      } else {
        // 순위 데이터가 없으면 초기값으로 생성
        return {
          id: null,
          league_id: parseInt(leagueId),
          team_id: team.id,
          season_year: seasonYear,
          wins: 0,
          losses: 0,
          draws: 0,
          points: 0,
          goal_difference: 0,
          goals_for: 0,
          goals_against: 0,
          rank: 0,
          team_name: team.name,
          team_logo: team.logo_path,
          is_ai: team.is_ai
        };
      }
    });
    
    // 정렬 (points DESC, goal_difference DESC, goals_for DESC)
    allStandings.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goal_difference !== a.goal_difference) return b.goal_difference - a.goal_difference;
      return (b.goals_for || 0) - (a.goals_for || 0);
    });
    
    // 순위 추가
    const standingsWithRank = allStandings.map((standing, index) => ({
      ...standing,
      rank: index + 1
    }));
    
    res.json(standingsWithRank);
  } catch (error) {
    console.error('리그 순위 조회 오류:', error);
    res.status(500).json({ error: error.message || '리그 순위 조회 실패' });
  } finally {
    if (conn) conn.release();
  }
});

module.exports = router;
