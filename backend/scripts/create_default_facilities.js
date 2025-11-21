// 기존 팀에 기본 시설 생성 스크립트
const pool = require('../database/pool');

async function createDefaultFacilities() {
  let conn;
  try {
    conn = await pool.getConnection();
    
    // 모든 팀 조회
    const teams = await conn.query('SELECT id FROM teams');
    
    console.log(`총 ${teams.length}개 팀 발견`);
    
    for (const team of teams) {
      const teamId = team.id;
      
      // 경기장 확인
      const [stadium] = await conn.query(
        'SELECT id FROM stadiums WHERE team_id = ?',
        [teamId]
      );
      
      if (!stadium || stadium.length === 0) {
        // 경기장 생성
        await conn.query(
          `INSERT INTO stadiums (team_id, level, name, max_capacity, monthly_maintenance_cost)
           VALUES (?, 1, '기본 아레나', 100, 1000000)`,
          [teamId]
        );
        console.log(`팀 ${teamId}: 경기장 생성 완료`);
      }
      
      // 숙소 확인
      const [dormitory] = await conn.query(
        'SELECT id FROM dormitories WHERE team_id = ?',
        [teamId]
      );
      
      if (!dormitory || dormitory.length === 0) {
        // 숙소 생성
        const conditionBonus = 10 + Math.floor(Math.random() * 21); // 10~30
        const growthBonus = Math.floor(conditionBonus / 2);
        await conn.query(
          `INSERT INTO dormitories (team_id, level, condition_bonus, growth_bonus, monthly_maintenance_cost)
           VALUES (?, 1, ?, ?, 500000)`,
          [teamId, conditionBonus, growthBonus]
        );
        console.log(`팀 ${teamId}: 숙소 생성 완료`);
      }
      
      // 훈련장 확인
      const [training] = await conn.query(
        'SELECT id FROM training_facilities WHERE team_id = ?',
        [teamId]
      );
      
      if (!training || training.length === 0) {
        await conn.query(
          `INSERT INTO training_facilities (team_id, level, growth_bonus, monthly_maintenance_cost)
           VALUES (?, 1, 5.0, 1000000)`,
          [teamId]
        );
        console.log(`팀 ${teamId}: 훈련장 생성 완료`);
      }
      
      // 의료실 확인
      const [medical] = await conn.query(
        'SELECT id FROM medical_rooms WHERE team_id = ?',
        [teamId]
      );
      
      if (!medical || medical.length === 0) {
        await conn.query(
          `INSERT INTO medical_rooms (team_id, level, recovery_speed_bonus, condition_recovery_bonus, monthly_maintenance_cost)
           VALUES (?, 1, 3.0, 1.0, 1000000)`,
          [teamId]
        );
        console.log(`팀 ${teamId}: 의료실 생성 완료`);
      }
      
      // 미디어실 확인
      const [media] = await conn.query(
        'SELECT id FROM media_rooms WHERE team_id = ?',
        [teamId]
      );
      
      if (!media || media.length === 0) {
        await conn.query(
          `INSERT INTO media_rooms (team_id, level, awareness_bonus, fan_growth_bonus, monthly_maintenance_cost)
           VALUES (?, 1, 2.0, 1.0, 1000000)`,
          [teamId]
        );
        console.log(`팀 ${teamId}: 미디어실 생성 완료`);
      }
    }
    
    console.log('모든 팀의 기본 시설 생성 완료');
  } catch (error) {
    console.error('오류:', error);
  } finally {
    if (conn) conn.release();
    process.exit(0);
  }
}

createDefaultFacilities();

