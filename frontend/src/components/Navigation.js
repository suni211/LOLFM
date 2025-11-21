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
      
      // 게임 시간 조회 (인증 선택적)
      try {
        const timeResponse = await axios.get(`${API_URL}/game-time`, {
          ...(token && { headers: { Authorization: `Bearer ${token}` } }),
          withCredentials: true
        });
        if (timeResponse.data) {
          setGameTime(timeResponse.data);
        }
      } catch (timeError) {
        console.log('게임 시간 로드 실패, 기본값 사용');
        setGameTime({ current_year: 2024, current_month: 1 });
      }

      // 재정 정보 조회 (에러가 나도 계속 진행)
      if (team && team.id) {
        try {
          const financeResponse = await axios.get(`${API_URL}/financial/maintenance/${team.id}`, {
            headers: { Authorization: `Bearer ${token}` },
            withCredentials: true
          });
          if (financeResponse.data) {
            setFinances(financeResponse.data);
          }
        } catch (financeError) {
          // 재정 정보는 실패해도 계속 진행
          console.log('재정 정보 로드 실패 (무시)');
        }
      }
    } catch (error) {
      console.error('게임 데이터 로드 오류:', error);
      // 기본값 설정
      if (!gameTime) {
        setGameTime({ current_year: 2024, current_month: 1 });
      }
    }
  };

  const formatMoney = (amount) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : (amount || 0);
    if (numAmount >= 100000000) {
      const eok = numAmount / 100000000;
      // 소수점이 0이면 정수로 표시
      return eok % 1 === 0 ? `${eok}억` : `${eok.toFixed(1)}억`;
    } else if (numAmount >= 10000) {
      return `${Math.floor(numAmount / 10000)}만`;
    }
    return numAmount.toLocaleString() || '0';
  };

  const formatDate = () => {
    if (!gameTime) {
      // 기본값: 현재 년도, 1월
      const now = new Date();
      return `${now.getFullYear()}년 1월`;
    }
    // current_year와 current_month는 백틱으로 감싸져 있으므로 직접 접근
    const year = gameTime.current_year || gameTime.current_year || 2024;
    const month = gameTime.current_month || gameTime.current_month || 1;
    return `${year}년 ${month}월`;
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
                <span className="stat-value">{formatMoney(team.money || finances?.current_money || 0)}</span>
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

