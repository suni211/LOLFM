const express = require('express');
const router = express.Router();
const SponsorService = require('../services/sponsorService');
const { pool } = require('../server');

// 스폰서 제안 받기
router.get('/offer/:teamId', async (req, res) => {
  try {
    const { teamId } = req.params;
    const sponsor = await SponsorService.offerSponsor(teamId);
    res.json(sponsor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 스폰서 계약
router.post('/contract', async (req, res) => {
  try {
    const { teamId, sponsorData } = req.body;
    const result = await SponsorService.contractSponsor(teamId, sponsorData);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 현재 스폰서 조회
router.get('/team/:teamId', async (req, res) => {
  try {
    const { teamId } = req.params;
    const conn = await pool.getConnection();
    const sponsors = await conn.query(
      'SELECT * FROM sponsors WHERE team_id = ? AND CURDATE() BETWEEN contract_start AND contract_end',
      [teamId]
    );
    conn.release();
    res.json(sponsors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

