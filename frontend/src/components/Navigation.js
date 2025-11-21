import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import authService from '../services/auth';
import './Navigation.css';

function Navigation({ user, onLogout, team }) {
  const location = useLocation();
  const [gameTime, setGameTime] = useState(null);
  const [finances, setFinances] = useState(null);

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  useEffect(() => {
    if (team) {
      loadGameData();
      const interval = setInterval(loadGameData, 30000); // 30초마다 업데이트
      return () => clearInterval(interval);
    }
  }, [team]);

  const loadGameData = async () => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const token = authService.getTokenValue();
      
      // 게임 시간 조회
      const timeResponse = await axios.get(`${API_URL}/game-time`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGameTime(timeResponse.data);

      // 재정 정보 조회
      const financeResponse = await axios.get(`${API_URL}/financial/${team.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFinances(financeResponse.data);
    } catch (error) {
      console.error('게임 데이터 로드 오류:', error);
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
    <nav className="navigation">
      <div className="nav-container">
        <div className="nav-brand">
          <Link to="/">
            <span className="brand-icon">⚡</span>
            <span className="brand-text">LOLFM</span>
          </Link>
        </div>

        {user && team && (
          <div className="nav-stats">
            <div className="stat-item">
              <span className="stat-icon">📅</span>
              <div className="stat-content">
                <span className="stat-label">게임 날짜</span>
                <span className="stat-value">{formatDate()}</span>
              </div>
            </div>
            <div className="stat-item">
              <span className="stat-icon">💰</span>
              <div className="stat-content">
                <span className="stat-label">보유 자금</span>
                <span className="stat-value">{formatMoney(finances?.current_money)}</span>
              </div>
            </div>
            <div className="stat-item">
              <span className="stat-icon">🏟️</span>
              <div className="stat-content">
                <span className="stat-label">경기장</span>
                <span className="stat-value">Lv.{team.stadium_level || 1}</span>
              </div>
            </div>
            <div className="stat-item">
              <span className="stat-icon">🏠</span>
              <div className="stat-content">
                <span className="stat-label">숙소</span>
                <span className="stat-value">Lv.{team.dormitory_level || 1}</span>
              </div>
            </div>
          </div>
        )}

        {user && (
          <>
            <div className="nav-links">
              <Link to="/" className={`nav-link ${isActive('/')}`}>
                <span className="nav-icon">🏠</span>
                <span className="nav-text">홈</span>
              </Link>
              <Link to="/team-management" className={`nav-link ${isActive('/team-management')}`}>
                <span className="nav-icon">👥</span>
                <span className="nav-text">팀 관리</span>
              </Link>
              <Link to="/league-standings" className={`nav-link ${isActive('/league-standings')}`}>
                <span className="nav-icon">🏆</span>
                <span className="nav-text">리그 순위</span>
              </Link>
              <Link to="/rankings" className={`nav-link ${isActive('/rankings')}`}>
                <span className="nav-icon">📊</span>
                <span className="nav-text">랭킹</span>
              </Link>
            </div>

            <div className="nav-user">
              <div className="user-info">
                <img src={user.picture} alt={user.name} className="user-avatar" />
                <span className="user-name">{user.name}</span>
              </div>
              <button onClick={onLogout} className="logout-btn">
                로그아웃
              </button>
            </div>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navigation;

