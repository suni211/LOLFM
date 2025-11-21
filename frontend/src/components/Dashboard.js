import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import authService from '../services/auth';
import LogoUpload from './LogoUpload';
import './Dashboard.css';

function Dashboard({ user, team }) {
  const [finances, setFinances] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [gameTime, setGameTime] = useState(null);
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    loadData();
  }, [team]);

  const loadData = async () => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const token = authService.getTokenValue();

      // 재정 정보 조회
      const financeResponse = await axios.get(`${API_URL}/financial/maintenance/${team.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFinances(financeResponse.data);

      // 알림 조회
      const notificationResponse = await axios.get(`${API_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(notificationResponse.data.slice(0, 5));

      // 게임 시간 조회
      const timeResponse = await axios.get(`${API_URL}/game-time`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGameTime(timeResponse.data);

      // 선수 목록 조회
      const playersResponse = await axios.get(`${API_URL}/players/team/${team.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPlayers(playersResponse.data);
    } catch (error) {
      console.error('데이터 로드 오류:', error);
    }
  };

  const formatMoney = (amount) => {
    if (amount >= 100000000) {
      return `${(amount / 100000000).toFixed(1)}억`;
    } else if (amount >= 10000) {
      return `${(amount / 10000).toFixed(0)}만`;
    }
    return amount?.toLocaleString() || '0';
  };

  const formatDate = () => {
    if (!gameTime) return '로딩...';
    return `${gameTime.current_year}년 ${gameTime.current_month}월`;
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="dashboard-title">{team.name}</div>
        <div className="dashboard-subtitle">
          {formatDate()} | 환영합니다, {user.name}님!
        </div>
      </div>

      {/* 주요 통계 */}
      <div className="dashboard-section">
        <h2 className="section-title">📊 팀 현황</h2>
        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-icon">💰</span>
              <span className="stat-label">보유 자금</span>
            </div>
            <div className="stat-value">{formatMoney(team.money)}</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-icon">👥</span>
              <span className="stat-label">선수 인원</span>
            </div>
            <div className="stat-value">{players.length}명</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-icon">🏟️</span>
              <span className="stat-label">경기장</span>
            </div>
            <div className="stat-value">Lv.{team.stadium_level || 1}</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-icon">🏠</span>
              <span className="stat-label">숙소</span>
            </div>
            <div className="stat-value">Lv.{team.dormitory_level || 1}</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-icon">📈</span>
              <span className="stat-label">팬 수</span>
            </div>
            <div className="stat-value">{formatMoney(team.fans)}</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-icon">⭐</span>
              <span className="stat-label">명성</span>
            </div>
            <div className="stat-value">{team.reputation || 0}</div>
          </div>
        </div>
      </div>

      {/* 빠른 액세스 */}
      <div className="dashboard-section">
        <h2 className="section-title">⚡ 빠른 액세스</h2>
        <div className="quick-actions">
          <Link to="/team-management" className="action-btn">
            <span className="action-icon">👥</span>
            팀 관리
          </Link>
          <Link to="/facilities" className="action-btn">
            <span className="action-icon">🏗️</span>
            시설 업그레이드
          </Link>
          <Link to="/training" className="action-btn">
            <span className="action-icon">💪</span>
            선수 훈련
          </Link>
          <Link to="/sponsors" className="action-btn">
            <span className="action-icon">🤝</span>
            스폰서 관리
          </Link>
          <Link to="/transfer-market" className="action-btn">
            <span className="action-icon">🔄</span>
            이적 시장
          </Link>
          <Link to="/finances" className="action-btn">
            <span className="action-icon">💵</span>
            재정 관리
          </Link>
        </div>
      </div>

      {/* 알림 */}
      <div className="dashboard-section">
        <h2 className="section-title">🔔 최근 알림</h2>
        <div className="card">
          <div className="notifications-list">
            {notifications.length > 0 ? (
              notifications.map(notif => (
                <div key={notif.id} className="notification-item">
                  <div className="notification-header">
                    <span className="notification-title">{notif.title}</span>
                    <span className="notification-time">
                      {new Date(notif.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="notification-message">{notif.message}</div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>
                새로운 알림이 없습니다.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
