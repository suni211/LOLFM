const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const pool = require('../database/pool');
const path = require('path');
const fs = require('fs');

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
    
    res.json(convertBigInt(teams[0]));
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
    
    res.json(convertBigInt(teams[0]));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 팀 생성
router.post('/', upload.single('logo'), async (req, res) => {
  let conn;
  try {
    const { name, abbreviation, region_id, league_id, user_id } = req.body;
    
    console.log('팀 생성 요청:', { name, abbreviation, region_id, league_id, user_id });
    
    if (!name || !abbreviation || !region_id || !user_id) {
      return res.status(400).json({ error: '필수 정보가 누락되었습니다.' });
    }

    conn = await pool.getConnection();
    
    // 사용자가 이미 팀을 가지고 있는지 확인
    const existingTeam = await conn.query(
      'SELECT id FROM teams WHERE user_id = ?',
      [user_id]
    );
    
    if (existingTeam.length > 0) {
      conn.release();
      return res.status(400).json({ error: '이미 팀을 보유하고 있습니다.' });
    }
    
    // 리그가 꽉 찼는지 확인
    if (league_id) {
      const [league] = await conn.query(
        'SELECT max_teams FROM leagues WHERE id = ?',
        [league_id]
      );
      
      const teamCount = await conn.query(
        'SELECT COUNT(*) as count FROM teams WHERE league_id = ?',
        [league_id]
      );
      
      if (teamCount[0].count >= league.max_teams) {
        conn.release();
        return res.status(400).json({ error: '선택한 리그가 이미 정원이 찼습니다.' });
      }
    }
    
    // 로고 경로 설정
    const logoPath = req.file ? `/uploads/${req.file.filename}` : null;
    
    // 팀 생성
    const result = await conn.query(
      `INSERT INTO teams (user_id, region_id, league_id, name, abbreviation, logo_path, money)
       VALUES (?, ?, ?, ?, ?, ?, 100000000)`,
      [user_id, region_id, league_id || null, name, abbreviation, logoPath]
    );
    
    const teamId = result.insertId;
    console.log('팀 생성 완료:', teamId);
    
    // 포지션별로 2명씩 랜덤 AI 선수 배정
    const positions = ['TOP', 'JGL', 'MID', 'ADC', 'SPT'];
    const playerNames = {
      TOP: ['김탑', '이탑', '박탑', '최탑', '정탑'],
      JGL: ['김정글', '이정글', '박정글', '최정글', '정정글'],
      MID: ['김미드', '이미드', '박미드', '최미드', '정미드'],
      ADC: ['김원딜', '이원딜', '박원딜', '최원딜', '정원딜'],
      SPT: ['김서폿', '이서폿', '박서폿', '최서폿', '정서폿']
    };
    
    for (const position of positions) {
      // 각 포지션당 2명 배정
      for (let i = 0; i < 2; i++) {
        const names = playerNames[position];
        const name = names[Math.floor(Math.random() * names.length)] + (i + 1);
        const overall = 40 + Math.floor(Math.random() * 20); // 40-60
        const potential = 50 + Math.floor(Math.random() * 30); // 50-80
        
        await conn.query(
          `INSERT INTO players (
            team_id, name, position, nationality, overall, potential,
            mental, teamfight, laning, jungling, cs_skill, \`condition\`,
            leadership, will, competitiveness, dirty_play,
            is_ai, salary
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE, ?)`,
          [
            teamId, name, position, 'KR', overall, potential,
            40 + Math.floor(Math.random() * 20), // mental
            40 + Math.floor(Math.random() * 20), // teamfight
            40 + Math.floor(Math.random() * 20), // laning
            40 + Math.floor(Math.random() * 20), // jungling
            40 + Math.floor(Math.random() * 20), // cs_skill
            80 + Math.floor(Math.random() * 20), // condition
            40 + Math.floor(Math.random() * 20), // leadership
            50 + Math.floor(Math.random() * 30), // will
            50 + Math.floor(Math.random() * 30), // competitiveness
            10 + Math.floor(Math.random() * 20), // dirty_play
            5000000 // salary (500만원)
          ]
        );
      }
    }
    
    console.log('선수 배정 완료 (10명)');
    
    // 생성된 팀 정보 반환
    const [newTeam] = await conn.query(
      'SELECT * FROM teams WHERE id = ?',
      [teamId]
    );
    
    conn.release();
    res.status(201).json(convertBigInt(newTeam));
  } catch (error) {
    console.error('팀 생성 오류:', error);
    if (conn) conn.release();
    res.status(500).json({ error: '팀 생성에 실패했습니다.', details: error.message });
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

module.exports = router;

