const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { pool } = require('../server');
const path = require('path');
const fs = require('fs');

// 팀 정보 조회
router.get('/:teamId', async (req, res) => {
  try {
    const { teamId } = req.params;
    const conn = await pool.getConnection();
    const teams = await conn.query(
      'SELECT * FROM teams WHERE id = ?',
      [teamId]
    );
    conn.release();
    
    if (teams.length === 0) {
      return res.status(404).json({ error: '팀을 찾을 수 없습니다.' });
    }
    
    res.json(teams[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 사용자 팀 조회
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const conn = await pool.getConnection();
    const teams = await conn.query(
      'SELECT * FROM teams WHERE user_id = ? LIMIT 1',
      [userId]
    );
    conn.release();
    
    if (teams.length === 0) {
      return res.status(404).json({ error: '팀을 찾을 수 없습니다.' });
    }
    
    res.json(teams[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 로고 업로드
router.post('/:teamId/logo', upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '파일이 업로드되지 않았습니다.' });
    }

    const { teamId } = req.params;
    const conn = await pool.getConnection();

    // 기존 로고 삭제
    const team = await conn.query(
      'SELECT logo_path FROM teams WHERE id = ?',
      [teamId]
    );

    if (team.length === 0) {
      conn.release();
      // 업로드된 파일 삭제
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: '팀을 찾을 수 없습니다.' });
    }

    // 기존 로고 파일 삭제
    if (team[0].logo_path) {
      const oldLogoPath = path.join(__dirname, '../public', team[0].logo_path);
      if (fs.existsSync(oldLogoPath)) {
        fs.unlinkSync(oldLogoPath);
      }
    }

    // 새 로고 경로 저장
    const logoPath = `/uploads/logos/${req.file.filename}`;
    await conn.query(
      'UPDATE teams SET logo_path = ? WHERE id = ?',
      [logoPath, teamId]
    );

    conn.release();
    res.json({ 
      success: true, 
      logoPath: logoPath,
      message: '로고가 업로드되었습니다.' 
    });
  } catch (error) {
    console.error('로고 업로드 오류:', error);
    // 업로드된 파일 삭제
    if (req.file && req.file.path) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: error.message });
  }
});

// 로고 삭제
router.delete('/:teamId/logo', async (req, res) => {
  try {
    const { teamId } = req.params;
    const conn = await pool.getConnection();

    const team = await conn.query(
      'SELECT logo_path FROM teams WHERE id = ?',
      [teamId]
    );

    if (team.length === 0) {
      conn.release();
      return res.status(404).json({ error: '팀을 찾을 수 없습니다.' });
    }

    // 로고 파일 삭제
    if (team[0].logo_path) {
      const logoPath = path.join(__dirname, '../public', team[0].logo_path);
      if (fs.existsSync(logoPath)) {
        fs.unlinkSync(logoPath);
      }
    }

    // 데이터베이스에서 로고 경로 제거
    await conn.query(
      'UPDATE teams SET logo_path = NULL WHERE id = ?',
      [teamId]
    );

    conn.release();
    res.json({ success: true, message: '로고가 삭제되었습니다.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 팀 생성
router.post('/', async (req, res) => {
  try {
    const { userId, regionId, name } = req.body;
    const conn = await pool.getConnection();

    // 사용자 확인
    const users = await conn.query(
      'SELECT id FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      conn.release();
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }

    // 지역 확인
    const regions = await conn.query(
      'SELECT id FROM regions WHERE id = ?',
      [regionId]
    );

    if (regions.length === 0) {
      conn.release();
      return res.status(404).json({ error: '지역을 찾을 수 없습니다.' });
    }

    // 1부 리그 찾기
    const league = await conn.query(
      'SELECT id, current_teams, max_teams FROM leagues WHERE region_id = ? AND division = 1',
      [regionId]
    );

    let leagueId = null;
    if (league.length > 0) {
      // 1부가 꽉 찼는지 확인
      if (league[0].current_teams < league[0].max_teams) {
        leagueId = league[0].id;
        // 현재 팀 수 증가
        await conn.query(
          'UPDATE leagues SET current_teams = current_teams + 1 WHERE id = ?',
          [leagueId]
        );
      } else {
        // 2부 리그로 배정
        const league2 = await conn.query(
          'SELECT id FROM leagues WHERE region_id = ? AND division = 2',
          [regionId]
        );
        if (league2.length > 0) {
          leagueId = league2[0].id;
          await conn.query(
            'UPDATE leagues SET current_teams = current_teams + 1 WHERE id = ?',
            [leagueId]
          );
        }
      }
    }

    // 팀 생성
    const result = await conn.query(
      `INSERT INTO teams (user_id, region_id, league_id, name)
       VALUES (?, ?, ?, ?)`,
      [userId, regionId, leagueId, name]
    );

    // 기본 시설 생성
    await conn.query(
      `INSERT INTO stadiums (team_id, level, name, max_capacity, current_capacity, monthly_maintenance_cost)
       VALUES (?, 1, '기본 아레나', 100, 100, 500000)`,
      [result.insertId]
    );

    await conn.query(
      `INSERT INTO dormitories (team_id, level, condition_bonus, growth_bonus, monthly_maintenance_cost)
       VALUES (?, 1, 0, 0, 300000)`,
      [result.insertId]
    );

    conn.release();
    res.json({ success: true, teamId: result.insertId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

