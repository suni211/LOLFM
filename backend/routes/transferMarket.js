const express = require('express');
const router = express.Router();
const pool = require('../database/pool');

// 거래 시장 목록
router.get('/', async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const market = await conn.query(
      `SELECT tm.*, p.name as player_name, p.position, p.overall,
       st.name as seller_team_name
       FROM transfer_market tm
       JOIN players p ON tm.player_id = p.id
       JOIN teams st ON tm.seller_team_id = st.id
       WHERE tm.status = 'OPEN'
       ORDER BY tm.created_at DESC`
    );
    conn.release();
    res.json(market);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 선수 판매 등록
router.post('/sell', async (req, res) => {
  try {
    const { playerId, teamId, askingPrice } = req.body;
    const conn = await pool.getConnection();
    
    const result = await conn.query(
      `INSERT INTO transfer_market (player_id, seller_team_id, asking_price, status)
       VALUES (?, ?, ?, 'OPEN')`,
      [playerId, teamId, askingPrice]
    );
    
    conn.release();
    res.json({ success: true, marketId: result.insertId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 선수 판매 등록 (list 엔드포인트)
router.post('/list', async (req, res) => {
  try {
    const { playerId, price } = req.body;
    const conn = await pool.getConnection();
    
    // 선수 정보 조회
    const [player] = await conn.query('SELECT team_id FROM players WHERE id = ?', [playerId]);
    if (!player || !player.team_id) {
      conn.release();
      return res.status(404).json({ error: '선수를 찾을 수 없습니다.' });
    }
    
    const result = await conn.query(
      `INSERT INTO transfer_market (player_id, seller_team_id, asking_price, status)
       VALUES (?, ?, ?, 'OPEN')
       ON DUPLICATE KEY UPDATE asking_price = ?, status = 'OPEN'`,
      [playerId, player.team_id, price, price]
    );
    
    conn.release();
    res.json({ success: true, marketId: result.insertId });
  } catch (error) {
    console.error('선수 판매 등록 오류:', error);
    res.status(500).json({ error: error.message || '판매 등록 실패' });
  }
});

// 거래 제안
router.post('/:marketId/offer', async (req, res) => {
  try {
    const { marketId } = req.params;
    const { buyerTeamId, offerPrice } = req.body;
    const conn = await pool.getConnection();
    
    await conn.query(
      `UPDATE transfer_market 
       SET buyer_team_id = ?, status = 'NEGOTIATING'
       WHERE id = ?`,
      [buyerTeamId, marketId]
    );
    
    conn.release();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

