const express = require('express');
const router = express.Router();
const FinancialService = require('../services/financialService');

// 월별 정산 처리
router.post('/settlement/:teamId', async (req, res) => {
  try {
    const { teamId } = req.params;
    const result = await FinancialService.processMonthlySettlement(teamId);
    res.json(result);
  } catch (error) {
    console.error('정산 처리 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 유지비 조회
router.get('/maintenance/:teamId', async (req, res) => {
  try {
    const { teamId } = req.params;
    const maintenance = await FinancialService.calculateMonthlyMaintenance(teamId);
    res.json(maintenance);
  } catch (error) {
    console.error('유지비 조회 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 자금 경고 체크
router.get('/warning/:teamId', async (req, res) => {
  try {
    const { teamId } = req.params;
    const warning = await FinancialService.checkFinancialWarning(teamId);
    res.json(warning);
  } catch (error) {
    console.error('경고 체크 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 재정 이력 조회
router.get('/records/:teamId', async (req, res) => {
  try {
    const { teamId } = req.params;
    const pool = require('../database/pool');
    const conn = await pool.getConnection();
    
    const records = await conn.query(
      `SELECT * FROM financial_records 
       WHERE team_id = ? 
       ORDER BY record_date DESC, created_at DESC 
       LIMIT 50`,
      [teamId]
    );
    
    conn.release();
    res.json(records);
  } catch (error) {
    console.error('재정 이력 조회 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 파산 이력 조회
router.get('/bankruptcy-history/:teamId', async (req, res) => {
  try {
    const { teamId } = req.params;
    const pool = require('../database/pool');
    const conn = await pool.getConnection();
    
    const history = await conn.query(
      `SELECT * FROM bankruptcy_history 
       WHERE team_id = ? 
       ORDER BY event_date DESC`,
      [teamId]
    );
    
    conn.release();
    res.json(history);
  } catch (error) {
    console.error('파산 이력 조회 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 재정 요약
router.get('/summary/:teamId', async (req, res) => {
  try {
    const { teamId } = req.params;
    const pool = require('../database/pool');
    const conn = await pool.getConnection();
    
    // 팀 정보
    const [team] = await conn.query('SELECT money FROM teams WHERE id = ?', [teamId]);
    
    // 월별 수입 계산
    const [sponsor] = await conn.query(
      'SELECT monthly_support FROM sponsors WHERE team_id = ? AND CURDATE() BETWEEN contract_start AND contract_end',
      [teamId]
    );
    const sponsorIncome = sponsor?.monthly_support || 0;
    
    // 월별 지출 계산
    const maintenance = await FinancialService.calculateMonthlyMaintenance(teamId);
    const totalExpense = maintenance.total || 0;
    
    conn.release();
    
    res.json({
      current_money: team.money,
      monthly_income: sponsorIncome,
      monthly_expense: totalExpense,
      net_income: sponsorIncome - totalExpense
    });
  } catch (error) {
    console.error('재정 요약 조회 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

