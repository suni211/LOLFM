const express = require('express');
const router = express.Router();
const pool = require('../database/pool');
const LeagueService = require('../services/leagueService');

// 모든 리그 조회
router.get('/', async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    
    const leagues = await conn.query(
      `SELECT l.*, r.name as region_name, r.code as region_code
       FROM leagues l
       JOIN regions r ON l.region_id = r.id
       ORDER BY r.id, l.division`
    );
    
    const leaguesResponse = leagues.map(league => convertBigInt(league));
    res.json(leaguesResponse);
  } catch (error) {
    console.error('리그 조회 오류:', error);
    res.status(500).json({ error: '리그 조회 실패', details: error.message });
  } finally {
    if (conn) conn.release();
  }
});

// 지역별 리그 조회
router.get('/region/:regionId', async (req, res) => {
  let conn;
  try {
    const { regionId } = req.params;
    conn = await pool.getConnection();
    
    // 먼저 리그 정보 조회
    const leagues = await conn.query(
      'SELECT * FROM leagues WHERE region_id = ? ORDER BY division',
      [regionId]
    );
    
    // 각 리그의 현재 팀 수 조회 및 BigInt 변환
    const leaguesResponse = [];
    for (let league of leagues) {
      const teamCount = await conn.query(
        'SELECT COUNT(*) as count FROM teams WHERE league_id = ?',
        [league.id]
      );
      
      const leagueData = convertBigInt(league);
      leagueData.current_teams = teamCount[0]?.count || 0;
      leaguesResponse.push(leagueData);
    }
    
    console.log('리그 조회 결과:', leaguesResponse);
    res.json(leaguesResponse);
  } catch (error) {
    console.error('리그 조회 오류:', error);
    res.status(500).json({ error: '리그 조회 실패', details: error.message });
  } finally {
    if (conn) conn.release();
  }
});

// BigInt를 문자열로 변환하는 헬퍼 함수
function convertBigInt(obj) {
  const result = {};
  for (let key in obj) {
    if (typeof obj[key] === 'bigint') {
      result[key] = obj[key].toString();
    } else {
      result[key] = obj[key];
    }
  }
  return result;
}

// 특정 리그 정보 조회
router.get('/:leagueId', async (req, res) => {
  let conn;
  try {
    const { leagueId } = req.params;
    conn = await pool.getConnection();
    
    const [league] = await conn.query(
      'SELECT * FROM leagues WHERE id = ?',
      [leagueId]
    );
    
    if (!league) {
      return res.status(404).json({ error: '리그를 찾을 수 없습니다' });
    }
    
    res.json(convertBigInt(league));
  } catch (error) {
    console.error('리그 조회 오류:', error);
    res.status(500).json({ error: '리그 조회 실패' });
  } finally {
    if (conn) conn.release();
  }
});

// 리그에 AI 팀 채우기
router.post('/:leagueId/fill-ai', async (req, res) => {
  try {
    const { leagueId } = req.params;
    const result = await LeagueService.fillLeagueWithAITeams(leagueId);
    res.json(result);
  } catch (error) {
    console.error('AI 팀 생성 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 리그 스케줄 생성
router.post('/:leagueId/generate-schedule', async (req, res) => {
  try {
    const { leagueId } = req.params;
    const result = await LeagueService.generateLeagueSchedule(leagueId);
    res.json(result);
  } catch (error) {
    console.error('스케줄 생성 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

