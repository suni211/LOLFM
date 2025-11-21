import React, { useState, useEffect } from 'react';
import axios from 'axios';
import authService from '../services/auth';
import './Finances.css';

function Finances({ team }) {
  const [financial, setFinancial] = useState(null);
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    loadFinancialData();
  }, [team]);

  const loadFinancialData = async () => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const token = authService.getTokenValue();

      // 현재 재정 정보
      const financialResponse = await axios.get(`${API_URL}/financial/maintenance/${team.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFinancial(financialResponse.data);

      // 재정 기록
      const recordsResponse = await axios.get(`${API_URL}/financial/records/${team.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRecords(recordsResponse.data);

      // 요약
      const summaryResponse = await axios.get(`${API_URL}/financial/summary/${team.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSummary(summaryResponse.data);
    } catch (error) {
      console.error('재정 데이터 로드 오류:', error);
    }
  };

  const formatMoney = (amount) => {
    // null, undefined, NaN 처리
    if (!amount || isNaN(amount)) return '0';
    
    // 문자열을 숫자로 변환 (BigInt 처리)
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : Number(amount);
    if (isNaN(numAmount)) return '0';
    
    // 절댓값으로 처리
    const absAmount = Math.abs(numAmount);
    
    if (absAmount >= 100000000) {
      const eok = absAmount / 100000000;
      // 소수점이 0이면 정수로 표시
      return eok % 1 === 0 ? `${eok}억` : `${eok.toFixed(1)}억`;
    } else if (absAmount >= 10000) {
      return `${Math.floor(absAmount / 10000)}만`;
    }
    return absAmount.toLocaleString() || '0';
  };

  const getTypeIcon = (type) => {
    const icons = {
      income: '⬆️',
      expense: '⬇️',
      sponsor: '🤝',
      match: '🏆',
      facility: '🏗️',
      player: '👥',
      other: '💼'
    };
    return icons[type] || '💰';
  };

  return (
    <div className="finances">
      <div className="page-header">
        <h1 className="page-title">재정 관리</h1>
        <p className="page-subtitle">팀의 재정 상태를 관리하세요</p>
      </div>

      {/* 재정 요약 */}
      <div className="finance-summary">
        <div className="summary-card primary">
          <div className="summary-icon">💰</div>
          <div className="summary-info">
            <div className="summary-label">보유 자금</div>
            <div className="summary-value">{formatMoney(team.money)}</div>
          </div>
        </div>

        <div className="summary-card income">
          <div className="summary-icon">⬆️</div>
          <div className="summary-info">
            <div className="summary-label">월 수입</div>
            <div className="summary-value">+{formatMoney(summary?.monthly_income)}</div>
          </div>
        </div>

        <div className="summary-card expense">
          <div className="summary-icon">⬇️</div>
          <div className="summary-info">
            <div className="summary-label">월 지출</div>
            <div className="summary-value">-{formatMoney(summary?.monthly_expense)}</div>
          </div>
        </div>

        <div className="summary-card net">
          <div className="summary-icon">📊</div>
          <div className="summary-info">
            <div className="summary-label">순수익</div>
            <div className={`summary-value ${(Number(summary?.monthly_income || 0) - Number(summary?.monthly_expense || 0)) >= 0 ? 'positive' : 'negative'}`}>
              {(Number(summary?.monthly_income || 0) - Number(summary?.monthly_expense || 0)) >= 0 ? '+' : ''}
              {formatMoney(Number(summary?.monthly_income || 0) - Number(summary?.monthly_expense || 0))}
            </div>
          </div>
        </div>
      </div>

      {/* 지출 내역 */}
      {financial && (
        <div className="expense-breakdown">
          <h2 className="section-title">월별 지출 내역</h2>
          <div className="breakdown-grid">
            <div className="breakdown-item">
              <span className="breakdown-icon">🏟️</span>
              <div className="breakdown-info">
                <span className="breakdown-label">경기장 유지비</span>
                <span className="breakdown-value">-{formatMoney(financial.stadium)}</span>
              </div>
            </div>
            <div className="breakdown-item">
              <span className="breakdown-icon">🏠</span>
              <div className="breakdown-info">
                <span className="breakdown-label">숙소 유지비</span>
                <span className="breakdown-value">-{formatMoney(financial.dormitory)}</span>
              </div>
            </div>
            <div className="breakdown-item">
              <span className="breakdown-icon">💪</span>
              <div className="breakdown-info">
                <span className="breakdown-label">훈련장 유지비</span>
                <span className="breakdown-value">-{formatMoney(financial.training)}</span>
              </div>
            </div>
            <div className="breakdown-item">
              <span className="breakdown-icon">💵</span>
              <div className="breakdown-info">
                <span className="breakdown-label">선수 급여</span>
                <span className="breakdown-value">-{formatMoney(financial.salary)}</span>
              </div>
            </div>
            <div className="breakdown-item total">
              <span className="breakdown-icon">📋</span>
              <div className="breakdown-info">
                <span className="breakdown-label">총 지출</span>
                <span className="breakdown-value">-{formatMoney(financial.total)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 거래 기록 */}
      <div className="transaction-history">
        <h2 className="section-title">거래 기록</h2>
        <div className="transactions-list">
          {records.length > 0 ? (
            records.map(record => (
              <div key={record.id} className={`transaction-item ${record.type}`}>
                <span className="transaction-icon">{getTypeIcon(record.type)}</span>
                <div className="transaction-info">
                  <div className="transaction-description">{record.description}</div>
                  <div className="transaction-date">
                    {new Date(record.record_date).toLocaleDateString()}
                  </div>
                </div>
                <div className={`transaction-amount ${record.amount >= 0 ? 'positive' : 'negative'}`}>
                  {record.amount >= 0 ? '+' : ''}{formatMoney(Math.abs(record.amount))}
                </div>
              </div>
            ))
          ) : (
            <div className="no-records">거래 기록이 없습니다.</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Finances;

