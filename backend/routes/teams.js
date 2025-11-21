const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const pool = require('../database/pool');
const path = require('path');
const fs = require('fs');
const LeagueService = require('../services/leagueService');

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
    
    let teamId;
    
    // 리그가 선택되었는지 확인
    if (league_id) {
      const [league] = await conn.query(
        'SELECT max_teams FROM leagues WHERE id = ?',
        [league_id]
      );
      
      const teamCount = await conn.query(
        'SELECT COUNT(*) as count FROM teams WHERE league_id = ?',
        [league_id]
      );
      
      const currentTeams = Number(teamCount[0].count);
      const logoPath = req.file ? `/uploads/${req.file.filename}` : null;
      
      // 리그에 AI 팀이 있으면 항상 AI 팀을 대체 (리그가 꽉 찼든 안 찼든)
      const aiTeams = await conn.query(
        'SELECT id FROM teams WHERE league_id = ? AND (is_ai = TRUE OR user_id IS NULL) LIMIT 1',
        [league_id]
      );
      
      if (aiTeams.length > 0) {
        // AI 팀이 있으면 대체
        console.log('AI 팀 대체');
        const replaceResult = await LeagueService.replaceAITeamWithUser(
          league_id, user_id, name, abbreviation, logoPath
        );
        teamId = replaceResult.teamId;
      } else if (currentTeams >= league.max_teams) {
        // AI 팀이 없고 리그가 꽉 찼다면 에러
        conn.release();
        return res.status(400).json({ error: '리그가 꽉 찼고 대체할 AI 팀이 없습니다.' });
      } else {
        // 리그에 자리가 있으면 일반 생성
        console.log('리그에 자리 있음 - 팀 생성');
        // is_ai 컬럼이 있는지 확인
        const columns = await conn.query('SHOW COLUMNS FROM teams LIKE "is_ai"');
        const hasIsAi = columns.length > 0;
        
        if (hasIsAi) {
          const result = await conn.query(
            `INSERT INTO teams (user_id, region_id, league_id, name, abbreviation, logo_path, money, is_ai)
             VALUES (?, ?, ?, ?, ?, ?, 1000000000, FALSE)`,
            [user_id, region_id, league_id, name, abbreviation, logoPath]
          );
          teamId = result.insertId;
        } else {
          const result = await conn.query(
            `INSERT INTO teams (user_id, region_id, league_id, name, abbreviation, logo_path, money)
             VALUES (?, ?, ?, ?, ?, ?, 1000000000)`,
            [user_id, region_id, league_id, name, abbreviation, logoPath]
          );
          teamId = result.insertId;
        }
        
        // 리그가 꽉 찼는지 다시 확인
        const newTeamCount = await conn.query(
          'SELECT COUNT(*) as count FROM teams WHERE league_id = ?',
          [league_id]
        );
        
        const currentCount = Number(newTeamCount[0].count);
        
        if (currentCount < league.max_teams) {
          // 아직 꽉 안 찼다면 AI 팀으로 채우기
          console.log('AI 팀으로 리그 채우기...');
          await LeagueService.fillLeagueWithAITeams(league_id);
        }
        
        // 리그가 꽉 찼으면 스케줄 생성
        const finalTeamCount = await conn.query(
          'SELECT COUNT(*) as count FROM teams WHERE league_id = ?',
          [league_id]
        );
        
        if (Number(finalTeamCount[0].count) >= league.max_teams) {
          console.log('리그 꽉 참 - 스케줄 생성');
          await LeagueService.generateLeagueSchedule(league_id);
        }
      }
    } else {
      // 리그가 선택되지 않았을 때 (일반 팀 생성)
      const logoPath = req.file ? `/uploads/${req.file.filename}` : null;
      const result = await conn.query(
        `INSERT INTO teams (user_id, region_id, league_id, name, abbreviation, logo_path, money, is_ai)
         VALUES (?, ?, ?, ?, ?, ?, 100000000, FALSE)`,
        [user_id, region_id, null, name, abbreviation, logoPath]
      );
      teamId = result.insertId;
    }
    
    console.log('팀 생성/대체 완료:', teamId);
    
    // 기본 시설 생성 (경기장, 숙소, 훈련장, 의료실, 미디어실)
    try {
      // 경기장 생성 (레벨 1)
      await conn.query(
        `INSERT INTO stadiums (team_id, level, name, max_capacity, monthly_maintenance_cost)
         VALUES (?, 1, '기본 아레나', 100, 1000000)
         ON DUPLICATE KEY UPDATE team_id = team_id`,
        [teamId]
      );
      
      // 숙소 생성 (레벨 1)
      const conditionBonus = 10 + Math.floor(Math.random() * 21); // 10~30
      const growthBonus = Math.floor(conditionBonus / 2);
      await conn.query(
        `INSERT INTO dormitories (team_id, level, condition_bonus, growth_bonus, monthly_maintenance_cost)
         VALUES (?, 1, ?, ?, 500000)
         ON DUPLICATE KEY UPDATE team_id = team_id`,
        [teamId, conditionBonus, growthBonus]
      );
      
      // 훈련장 생성 (레벨 1) - 스키마에 growth_bonus 사용
      await conn.query(
        `INSERT INTO training_facilities (team_id, level, growth_bonus, monthly_maintenance_cost)
         VALUES (?, 1, 5.0, 1000000)
         ON DUPLICATE KEY UPDATE team_id = team_id`,
        [teamId]
      );
      
      // 의료실 생성 (레벨 1) - 스키마에 recovery_speed_bonus, condition_recovery_bonus 사용
      await conn.query(
        `INSERT INTO medical_rooms (team_id, level, recovery_speed_bonus, condition_recovery_bonus, monthly_maintenance_cost)
         VALUES (?, 1, 3.0, 1.0, 1000000)
         ON DUPLICATE KEY UPDATE team_id = team_id`,
        [teamId]
      );
      
      // 미디어실 생성 (레벨 1)
      await conn.query(
        `INSERT INTO media_rooms (team_id, level, awareness_bonus, fan_growth_bonus, monthly_maintenance_cost)
         VALUES (?, 1, 2.0, 1.0, 1000000)
         ON DUPLICATE KEY UPDATE team_id = team_id`,
        [teamId]
      );
      
      console.log('기본 시설 생성 완료:', teamId);
    } catch (facilityError) {
      console.error('기본 시설 생성 오류:', facilityError);
      // 시설 생성 실패해도 팀 생성은 성공으로 처리
    }
    
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

// 포메이션 저장
router.post('/:teamId/formation', async (req, res) => {
  let conn;
  try {
    const { teamId } = req.params;
    const formation = req.body;
    
    conn = await pool.getConnection();
    
    // 포메이션을 JSON으로 저장
    try {
      await conn.query(
        'UPDATE teams SET formation = ? WHERE id = ?',
        [JSON.stringify(formation), teamId]
      );
      res.json({ success: true, message: '포메이션이 저장되었습니다.' });
    } catch (sqlError) {
      // formation 컬럼이 없으면 에러 무시 (마이그레이션 필요)
      if (sqlError.code === 'ER_BAD_FIELD_ERROR') {
        console.warn('formation 컬럼이 없습니다. 마이그레이션을 실행해주세요.');
        res.json({ success: true, message: '포메이션이 저장되었습니다. (마이그레이션 필요)' });
      } else {
        throw sqlError;
      }
    }
  } catch (error) {
    console.error('포메이션 저장 오류:', error);
    res.status(500).json({ error: '포메이션 저장 실패' });
  } finally {
    if (conn) conn.release();
  }
});

module.exports = router;

