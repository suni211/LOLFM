const express = require('express');
const router = express.Router();
const pool = require('../database/pool');

// 팀 시설 조회
router.get('/:teamId', async (req, res) => {
  let conn;
  try {
    const { teamId } = req.params;
    conn = await pool.getConnection();
    
    // 경기장
    const [stadium] = await conn.query(
      'SELECT * FROM stadiums WHERE team_id = ?',
      [teamId]
    );
    
    // 숙소
    const [dormitory] = await conn.query(
      'SELECT * FROM dormitories WHERE team_id = ?',
      [teamId]
    );
    
    // 훈련장
    const [training] = await conn.query(
      'SELECT * FROM training_facilities WHERE team_id = ?',
      [teamId]
    );
    
    // 의료실
    const [medical] = await conn.query(
      'SELECT * FROM medical_rooms WHERE team_id = ?',
      [teamId]
    );
    
    // 미디어실
    const [media] = await conn.query(
      'SELECT * FROM media_rooms WHERE team_id = ?',
      [teamId]
    );
    
    // 시설 데이터 포맷팅
    const facilities = {
      stadium: stadium ? {
        level: stadium.level,
        max_level: 10,
        name: stadium.name,
        max_capacity: stadium.max_capacity,
        maintenance_cost: stadium.monthly_maintenance_cost,
        upgrade_cost: getStadiumUpgradeCost(stadium.level),
        upgrade_time: getStadiumUpgradeTime(stadium.level),
        effect: `최대 관중: ${stadium.max_capacity}명`
      } : null,
      dormitory: dormitory ? {
        level: dormitory.level,
        max_level: 20,
        condition_bonus: dormitory.condition_bonus,
        growth_bonus: dormitory.growth_bonus,
        maintenance_cost: dormitory.monthly_maintenance_cost,
        upgrade_cost: 100000000, // 1억
        upgrade_time: '1일',
        effect: `컨디션 +${dormitory.condition_bonus}, 성장 +${dormitory.growth_bonus}`
      } : null,
      training: training ? {
        level: training.level,
        max_level: 10,
        training_bonus: training.training_bonus,
        maintenance_cost: training.monthly_maintenance_cost,
        upgrade_cost: training.level * 50000000,
        upgrade_time: `${training.level}일`,
        effect: `훈련 효과 +${training.training_bonus}%`
      } : null,
      medical: medical ? {
        level: medical.level,
        max_level: 10,
        recovery_bonus: medical.recovery_bonus,
        injury_prevention: medical.injury_prevention,
        maintenance_cost: medical.monthly_maintenance_cost,
        upgrade_cost: medical.level * 50000000,
        upgrade_time: `${medical.level}일`,
        effect: `회복 +${medical.recovery_bonus}%, 부상 예방 +${medical.injury_prevention}%`
      } : null,
      media: media ? {
        level: media.level,
        max_level: 10,
        awareness_bonus: media.awareness_bonus,
        fan_growth_bonus: media.fan_growth_bonus,
        maintenance_cost: media.monthly_maintenance_cost,
        upgrade_cost: media.level * 50000000,
        upgrade_time: `${media.level}일`,
        effect: `인지도 +${media.awareness_bonus}, 팬 증가 +${media.fan_growth_bonus}%`
      } : null
    };
    
    res.json(facilities);
  } catch (error) {
    console.error('시설 조회 오류:', error);
    res.status(500).json({ error: '시설 조회 실패' });
  } finally {
    if (conn) conn.release();
  }
});

// 시설 업그레이드
router.post('/:teamId/upgrade', async (req, res) => {
  let conn;
  try {
    const { teamId } = req.params;
    const { facilityType } = req.body;
    
    conn = await pool.getConnection();
    
    // 팀 정보 조회
    const [team] = await conn.query(
      'SELECT money FROM teams WHERE id = ?',
      [teamId]
    );
    
    if (!team) {
      return res.status(404).json({ error: '팀을 찾을 수 없습니다.' });
    }
    
    let upgradeCost = 0;
    let updateQuery = '';
    
    switch (facilityType) {
      case 'stadium':
        const [stadium] = await conn.query(
          'SELECT level FROM stadiums WHERE team_id = ?',
          [teamId]
        );
        if (!stadium) return res.status(404).json({ error: '경기장을 찾을 수 없습니다.' });
        if (stadium.level >= 10) return res.status(400).json({ error: '이미 최대 레벨입니다.' });
        
        upgradeCost = getStadiumUpgradeCost(stadium.level);
        if (team.money < upgradeCost) {
          return res.status(400).json({ error: '자금이 부족합니다.' });
        }
        
        updateQuery = `
          UPDATE stadiums 
          SET level = level + 1,
              max_capacity = CASE 
                WHEN level = 1 THEN 150
                WHEN level = 2 THEN 300
                WHEN level = 3 THEN 500
                WHEN level = 4 THEN 1000
                WHEN level = 5 THEN 2000
                WHEN level = 6 THEN 5000
                WHEN level = 7 THEN 10000
                WHEN level = 8 THEN 11000
                WHEN level = 9 THEN 15000
                ELSE max_capacity
              END,
              name = CASE
                WHEN level < 4 THEN CONCAT(LEFT(name, LOCATE('아레나', name) - 1), '아레나')
                WHEN level < 7 THEN '실내 체육관'
                ELSE '스타디움'
              END,
              monthly_maintenance_cost = monthly_maintenance_cost + 1000000
          WHERE team_id = ?
        `;
        break;
        
      case 'dormitory':
        const [dormitory] = await conn.query(
          'SELECT level FROM dormitories WHERE team_id = ?',
          [teamId]
        );
        if (!dormitory) return res.status(404).json({ error: '숙소를 찾을 수 없습니다.' });
        if (dormitory.level >= 20) return res.status(400).json({ error: '이미 최대 레벨입니다.' });
        
        upgradeCost = 100000000; // 1억
        if (team.money < upgradeCost) {
          return res.status(400).json({ error: '자금이 부족합니다.' });
        }
        
        const bonus = 10 + Math.floor(Math.random() * 21); // 10~30 랜덤
        updateQuery = `
          UPDATE dormitories 
          SET level = level + 1,
              condition_bonus = condition_bonus + ${bonus},
              growth_bonus = growth_bonus + ${Math.floor(bonus / 2)},
              monthly_maintenance_cost = monthly_maintenance_cost + 500000
          WHERE team_id = ?
        `;
        break;
        
      case 'training':
      case 'medical':
      case 'media':
        const table = `${facilityType}_${facilityType === 'training' ? 'facilities' : 'rooms'}`;
        const [facility] = await conn.query(
          `SELECT level FROM ${table} WHERE team_id = ?`,
          [teamId]
        );
        
        if (!facility) {
          // 시설이 없으면 생성
          await conn.query(
            `INSERT INTO ${table} (team_id, level) VALUES (?, 1)`,
            [teamId]
          );
          upgradeCost = 50000000;
        } else {
          if (facility.level >= 10) return res.status(400).json({ error: '이미 최대 레벨입니다.' });
          upgradeCost = facility.level * 50000000;
        }
        
        if (team.money < upgradeCost) {
          return res.status(400).json({ error: '자금이 부족합니다.' });
        }
        
        updateQuery = `
          UPDATE ${table}
          SET level = level + 1,
              ${facilityType === 'training' ? 'training_bonus' : 
                facilityType === 'medical' ? 'recovery_bonus' : 'awareness_bonus'} = 
              ${facilityType === 'training' ? 'training_bonus + 5' : 
                facilityType === 'medical' ? 'recovery_bonus + 3' : 'awareness_bonus + 2'},
              monthly_maintenance_cost = monthly_maintenance_cost + 1000000
          WHERE team_id = ?
        `;
        break;
        
      default:
        return res.status(400).json({ error: '잘못된 시설 타입입니다.' });
    }
    
    // 업그레이드 실행
    await conn.query(updateQuery, [teamId]);
    
    // 팀 자금 차감
    await conn.query(
      'UPDATE teams SET money = money - ? WHERE id = ?',
      [upgradeCost, teamId]
    );
    
    res.json({ success: true, message: '업그레이드가 완료되었습니다.' });
  } catch (error) {
    console.error('시설 업그레이드 오류:', error);
    res.status(500).json({ error: '업그레이드 실패' });
  } finally {
    if (conn) conn.release();
  }
});

// 경기장 업그레이드 비용 계산
function getStadiumUpgradeCost(currentLevel) {
  const costs = [10000000, 20000000, 30000000, 40000000, 50000000, 100000000, 500000000, 10000000000, 20000000000, 30000000000];
  return costs[currentLevel - 1] || 0;
}

// 경기장 업그레이드 시간
function getStadiumUpgradeTime(currentLevel) {
  const times = ['10분', '20분', '40분', '60분', '120분', '300분', '1일', '10일', '12일', '12일'];
  return times[currentLevel - 1] || '0분';
}

module.exports = router;

