const express = require('express');
const router = express.Router();
const pool = require('../database/pool');

// 게임 시간 조회 (인증 불필요)
router.get('/', async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    let [gameTime] = await conn.query('SELECT * FROM game_time WHERE id = 1');
    
    if (!gameTime || gameTime.length === 0) {
      // 게임 시간이 없으면 초기화
      await conn.query(
        `INSERT INTO game_time (id, \`current_date\`, \`current_month\`, \`current_year\`, is_stove_league)
         VALUES (1, CURDATE(), MONTH(CURDATE()), YEAR(CURDATE()), FALSE)
         ON DUPLICATE KEY UPDATE 
         \`current_date\` = CURDATE(),
         \`current_month\` = MONTH(CURDATE()),
         \`current_year\` = YEAR(CURDATE())`
      );
      [gameTime] = await conn.query('SELECT * FROM game_time WHERE id = 1');
    }
    
    if (gameTime && gameTime.length > 0) {
      res.json(convertBigInt(gameTime[0]));
    } else {
      // 기본값 반환
      res.json({
        id: 1,
        current_date: new Date().toISOString().split('T')[0],
        current_month: new Date().getMonth() + 1,
        current_year: new Date().getFullYear(),
        is_stove_league: false
      });
    }
  } catch (error) {
    console.error('게임 시간 조회 오류:', error);
    // 에러가 나도 기본값 반환
    res.json({
      id: 1,
      current_date: new Date().toISOString().split('T')[0],
      current_month: new Date().getMonth() + 1,
      current_year: new Date().getFullYear(),
      is_stove_league: false
    });
  } finally {
    if (conn) conn.release();
  }
});

// BigInt 변환 헬퍼
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

module.exports = router;

