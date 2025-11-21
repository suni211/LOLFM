const express = require('express');
const router = express.Router();
const RankingService = require('../services/rankingService');

// 랭킹 조회
router.get('/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const { limit = 10 } = req.query;
    const rankings = await RankingService.getRankings(type, parseInt(limit));
    res.json(rankings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 랭킹 업데이트
router.post('/update', async (req, res) => {
  try {
    await RankingService.updateRankings();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

