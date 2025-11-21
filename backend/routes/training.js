const express = require('express');
const router = express.Router();
const pool = require('../database/pool');

// 선수 훈련
router.post('/:playerId', async (req, res) => {
  let conn;
  try {
    const { playerId } = req.params;
    const { trainingType } = req.body;
    
    conn = await pool.getConnection();
    
    // 선수 정보 조회
    const [player] = await conn.query(
      'SELECT * FROM players WHERE id = ?',
      [playerId]
    );
    
    if (!player || !player.team_id) {
      return res.status(404).json({ error: '선수를 찾을 수 없습니다.' });
    }
    
    // 게임 시간 조회
    const [gameTime] = await conn.query('SELECT * FROM game_time WHERE id = 1');
    const currentYear = gameTime.current_year;
    const currentMonth = gameTime.current_month;
    
    // 이번 달에 이미 훈련했는지 확인
    const [lastTraining] = await conn.query(
      `SELECT * FROM player_trainings 
       WHERE player_id = ? 
       AND training_year = ? 
       AND training_month = ?
       ORDER BY id DESC
       LIMIT 1`,
      [playerId, currentYear, currentMonth]
    );
    
    if (lastTraining && lastTraining.length > 0 && lastTraining[0]) {
      return res.status(400).json({ error: '이번 달에는 이미 훈련했습니다. 다음 달에 다시 시도해주세요.' });
    }
    
    // 훈련 타입에 따른 스탯 증가량
    const statIncreases = {
      mental: 1 + Math.floor(Math.random() * 2), // 1-2
      teamfight: 1 + Math.floor(Math.random() * 2),
      laning: 1 + Math.floor(Math.random() * 2),
      cs: 1 + Math.floor(Math.random() * 2),
      leadership: 1 + Math.floor(Math.random() * 2)
    };
    
    const statMap = {
      mental: 'mental',
      teamfight: 'teamfight',
      laning: 'laning',
      cs: 'cs_skill',
      leadership: 'leadership'
    };
    
    const statColumn = statMap[trainingType];
    if (!statColumn) {
      return res.status(400).json({ error: '잘못된 훈련 타입입니다.' });
    }
    
    const increase = statIncreases[trainingType];
    const newStatValue = Math.min(100, (player[statColumn] || 0) + increase);
    
    // 선수 스탯 업데이트
    await conn.query(
      `UPDATE players SET ${statColumn} = ? WHERE id = ?`,
      [newStatValue, playerId]
    );
    
    // 훈련 기록 저장
    // training_type은 ENUM('INDIVIDUAL', 'TEAM')이므로 'INDIVIDUAL'로 하드코딩
    // focus_stat에는 trainingType (예: 'mental', 'teamfight' 등) 저장
    const now = new Date();
    
    // 파라미터 순서 확인:
    // 1. player_id
    // 2. focus_stat (trainingType: 'mental', 'teamfight' 등)
    // 3. training_year
    // 4. training_month
    // 5. stat_increase
    // 6. start_date
    // 7. end_date
    try {
      await conn.query(
        `INSERT INTO player_trainings (
          player_id, training_type, focus_stat, training_year, training_month, stat_increase,
          start_date, end_date, status
        ) VALUES (?, 'INDIVIDUAL', ?, ?, ?, ?, ?, ?, 'COMPLETED')`,
        [playerId, trainingType, currentYear, currentMonth, increase, now, now]
      );
    } catch (insertError) {
      console.error('훈련 기록 저장 오류:', insertError);
      console.error('파라미터:', { playerId, trainingType, currentYear, currentMonth, increase });
      throw insertError;
    }
    
    // overall 재계산
    await conn.query(
      `UPDATE players SET overall = (
        (mental + teamfight + laning + jungling + cs_skill + leadership) / 6
      ) WHERE id = ?`,
      [playerId]
    );
    
    res.json({
      success: true,
      message: '훈련이 완료되었습니다!',
      statIncrease: increase,
      newStatValue: newStatValue
    });
  } catch (error) {
    console.error('훈련 오류:', error);
    res.status(500).json({ error: '훈련 실패' });
  } finally {
    if (conn) conn.release();
  }
});

// 선수 훈련 기록 조회
router.get('/player/:playerId/history', async (req, res) => {
  let conn;
  try {
    const { playerId } = req.params;
    conn = await pool.getConnection();
    
    const trainings = await conn.query(
      `SELECT * FROM player_trainings 
       WHERE player_id = ? 
       ORDER BY training_year DESC, training_month DESC
       LIMIT 10`,
      [playerId]
    );
    
    res.json(trainings);
  } catch (error) {
    console.error('훈련 기록 조회 오류:', error);
    res.status(500).json({ error: '훈련 기록 조회 실패' });
  } finally {
    if (conn) conn.release();
  }
});

module.exports = router;

