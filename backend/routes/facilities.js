const express = require('express');
const router = express.Router();
const pool = require('../database/pool');
const NotificationService = require('../services/notificationService');

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
        training_bonus: training.growth_bonus || 0, // 스키마는 growth_bonus지만 프론트엔드 호환을 위해 training_bonus로 매핑
        maintenance_cost: training.monthly_maintenance_cost,
        upgrade_cost: training.level * 50000000,
        upgrade_time: `${training.level}일`,
        effect: `훈련 효과 +${training.growth_bonus || 0}%`
      } : null,
      medical: medical ? {
        level: medical.level,
        max_level: 10,
        recovery_bonus: medical.recovery_speed_bonus || 0, // 스키마는 recovery_speed_bonus
        injury_prevention: medical.condition_recovery_bonus || 0, // 스키마는 condition_recovery_bonus
        maintenance_cost: medical.monthly_maintenance_cost,
        upgrade_cost: medical.level * 50000000,
        upgrade_time: `${medical.level}일`,
        effect: `회복 +${medical.recovery_speed_bonus || 0}%, 컨디션 회복 +${medical.condition_recovery_bonus || 0}%`
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
          'SELECT level, name FROM stadiums WHERE team_id = ?',
          [teamId]
        );
        if (!stadium || stadium.length === 0) return res.status(404).json({ error: '경기장을 찾을 수 없습니다.' });
        
        const currentStadiumLevel = stadium[0].level;
        if (currentStadiumLevel >= 10) return res.status(400).json({ error: '이미 최대 레벨입니다.' });
        
        upgradeCost = getStadiumUpgradeCost(currentStadiumLevel);
        if (team.money < upgradeCost) {
          return res.status(400).json({ error: '자금이 부족합니다.' });
        }
        
        const newLevel = currentStadiumLevel + 1;
        const capacityMap = {
          1: 100, 2: 150, 3: 300, 4: 500, 5: 1000,
          6: 2000, 7: 5000, 8: 10000, 9: 11000, 10: 15000
        };
        const newCapacity = capacityMap[newLevel] || 15000;
        
        let newName = stadium[0].name || '기본 아레나';
        if (newLevel < 5) {
          newName = newName.replace(/아레나|실내 체육관|스타디움/g, '') + '아레나';
        } else if (newLevel < 8) {
          newName = '실내 체육관';
        } else {
          newName = '스타디움';
        }
        
        await conn.query(
          `UPDATE stadiums 
           SET level = ?, max_capacity = ?, name = ?, 
               monthly_maintenance_cost = monthly_maintenance_cost + 1000000
           WHERE team_id = ?`,
          [newLevel, newCapacity, newName, teamId]
        );
        
        // 팀 자금 차감
        await conn.query(
          'UPDATE teams SET money = money - ? WHERE id = ?',
          [upgradeCost, teamId]
        );
        
        // 업그레이드 완료 알림
        await NotificationService.createFacilityUpgradeCompleteNotification(teamId, '경기장', newLevel);
        
        return res.json({ success: true, message: '경기장 업그레이드가 완료되었습니다.', newLevel });
        
      case 'dormitory':
        const [dormitory] = await conn.query(
          'SELECT level, condition_bonus, growth_bonus FROM dormitories WHERE team_id = ?',
          [teamId]
        );
        if (!dormitory || dormitory.length === 0) return res.status(404).json({ error: '숙소를 찾을 수 없습니다.' });
        
        const currentDormLevel = dormitory[0].level;
        if (currentDormLevel >= 20) return res.status(400).json({ error: '이미 최대 레벨입니다.' });
        
        upgradeCost = 100000000; // 1억
        if (team.money < upgradeCost) {
          return res.status(400).json({ error: '자금이 부족합니다.' });
        }
        
        const bonus = 10 + Math.floor(Math.random() * 21); // 10~30 랜덤
        const newDormLevel = currentDormLevel + 1;
        const newConditionBonus = (dormitory[0].condition_bonus || 0) + bonus;
        const newGrowthBonus = (dormitory[0].growth_bonus || 0) + Math.floor(bonus / 2);
        
        await conn.query(
          `UPDATE dormitories 
           SET level = ?, condition_bonus = ?, growth_bonus = ?,
               monthly_maintenance_cost = monthly_maintenance_cost + 500000
           WHERE team_id = ?`,
          [newDormLevel, newConditionBonus, newGrowthBonus, teamId]
        );
        
        // 팀 자금 차감
        await conn.query(
          'UPDATE teams SET money = money - ? WHERE id = ?',
          [upgradeCost, teamId]
        );
        
        // 업그레이드 완료 알림
        await NotificationService.createFacilityUpgradeCompleteNotification(teamId, '숙소', newDormLevel);
        
        return res.json({ success: true, message: '숙소 업그레이드가 완료되었습니다.', newLevel: newDormLevel });
        
      case 'training':
      case 'medical':
      case 'media':
        const table = `${facilityType}_${facilityType === 'training' ? 'facilities' : 'rooms'}`;
        const [facility] = await conn.query(
          `SELECT level FROM ${table} WHERE team_id = ?`,
          [teamId]
        );
        
        let currentFacilityLevel = 0;
        if (!facility || facility.length === 0) {
          // 시설이 없으면 생성
          if (facilityType === 'training') {
            await conn.query(
              `INSERT INTO training_facilities (team_id, level, growth_bonus, monthly_maintenance_cost)
               VALUES (?, 1, 5.0, 1000000)`,
              [teamId]
            );
          } else if (facilityType === 'medical') {
            await conn.query(
              `INSERT INTO medical_rooms (team_id, level, recovery_speed_bonus, condition_recovery_bonus, monthly_maintenance_cost)
               VALUES (?, 1, 3.0, 1.0, 1000000)`,
              [teamId]
            );
          } else if (facilityType === 'media') {
            await conn.query(
              `INSERT INTO media_rooms (team_id, level, awareness_bonus, fan_growth_bonus, monthly_maintenance_cost)
               VALUES (?, 1, 2.0, 1.0, 1000000)`,
              [teamId]
            );
          }
          currentFacilityLevel = 1;
          upgradeCost = 50000000;
        } else {
          currentFacilityLevel = facility[0].level;
          if (currentFacilityLevel >= 10) return res.status(400).json({ error: '이미 최대 레벨입니다.' });
          upgradeCost = currentFacilityLevel * 50000000;
        }
        
        if (team.money < upgradeCost) {
          return res.status(400).json({ error: '자금이 부족합니다.' });
        }
        
        const newFacilityLevel = currentFacilityLevel + 1;
        
        // 시설 타입별 업데이트
        if (facilityType === 'training') {
          await conn.query(
            `UPDATE training_facilities
             SET level = ?,
                 growth_bonus = growth_bonus + 5.0,
                 monthly_maintenance_cost = monthly_maintenance_cost + 1000000
             WHERE team_id = ?`,
            [newFacilityLevel, teamId]
          );
        } else if (facilityType === 'medical') {
          await conn.query(
            `UPDATE medical_rooms
             SET level = ?,
                 recovery_speed_bonus = recovery_speed_bonus + 3.0,
                 condition_recovery_bonus = condition_recovery_bonus + 1.0,
                 monthly_maintenance_cost = monthly_maintenance_cost + 1000000
             WHERE team_id = ?`,
            [newFacilityLevel, teamId]
          );
        } else if (facilityType === 'media') {
          await conn.query(
            `UPDATE media_rooms
             SET level = ?,
                 awareness_bonus = awareness_bonus + 2.0,
                 fan_growth_bonus = fan_growth_bonus + 1.0,
                 monthly_maintenance_cost = monthly_maintenance_cost + 1000000
             WHERE team_id = ?`,
            [newFacilityLevel, teamId]
          );
        }
        
        // 팀 자금 차감
        await conn.query(
          'UPDATE teams SET money = money - ? WHERE id = ?',
          [upgradeCost, teamId]
        );
        
        // 업그레이드 완료 알림
        const facilityNames = {
          training: '훈련장',
          medical: '의료실',
          media: '미디어실'
        };
        await NotificationService.createFacilityUpgradeCompleteNotification(
          teamId, 
          facilityNames[facilityType] || '시설', 
          newFacilityLevel
        );
        
        return res.json({ success: true, message: '시설 업그레이드가 완료되었습니다.', newLevel: newFacilityLevel });
        
      default:
        return res.status(400).json({ error: '잘못된 시설 타입입니다.' });
    }
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

