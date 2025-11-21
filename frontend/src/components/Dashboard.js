import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import authService from '../services/auth';
import LogoUpload from './LogoUpload';
import MatchWatch from './MatchWatch';
import './Dashboard.css';

function Dashboard({ user, team }) {
  const [finances, setFinances] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [gameTime, setGameTime] = useState(null);
  const [players, setPlayers] = useState([]);
  const [todayMatches, setTodayMatches] = useState([]);
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [selectedMatchId, setSelectedMatchId] = useState(null);
  const [recentMatches, setRecentMatches] = useState([]);

  useEffect(() => {
    loadData();
  }, [team]);

  const loadData = async () => {
    if (!team || !team.id) return;
    
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const token = authService.getTokenValue();

      if (!token) {
        console.log('토큰이 없습니다.');
        return;
      }

      // 재정 정보 조회
      try {
        const financeResponse = await axios.get(`${API_URL}/financial/maintenance/${team.id}`, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true
        });
        setFinances(financeResponse.data);
      } catch (error) {
        console.log('재정 정보 로드 실패:', error.response?.status);
      }

      // 알림 조회 (선택적 - 실패해도 계속 진행)
      try {
        const notificationResponse = await axios.get(`${API_URL}/notifications`, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true
        });
        if (notificationResponse.data) {
          setNotifications(notificationResponse.data.slice(0, 5));
        }
      } catch (error) {
        // 401 오류는 무시 (인증 문제일 수 있음)
        if (error.response?.status !== 401) {
          console.log('알림 조회 실패:', error.response?.status);
        }
        setNotifications([]);
      }

      // 게임 시간 조회
      try {
        const timeResponse = await axios.get(`${API_URL}/game-time`, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true
        });
        setGameTime(timeResponse.data);
      } catch (error) {
        console.log('게임 시간 조회 실패:', error.response?.status);
      }

      // 선수 목록 조회
      try {
        const playersResponse = await axios.get(`${API_URL}/players/team/${team.id}`, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true
        });
        setPlayers(playersResponse.data || []);
      } catch (error) {
        console.log('선수 목록 조회 실패:', error.response?.status);
      }

      // 오늘의 경기 조회
      try {
        const matchesResponse = await axios.get(`${API_URL}/matches/today/${team.id}`, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true
        });
        setTodayMatches(matchesResponse.data || []);
      } catch (error) {
        console.log('오늘의 경기 없음:', error.response?.status);
      }

      // 다음 경기 스케줄 조회
      try {
        const upcomingResponse = await axios.get(`${API_URL}/matches/upcoming/${team.id}?limit=5`, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true
        });
        setUpcomingMatches(upcomingResponse.data || []);
      } catch (error) {
        console.log('다음 경기 조회 실패:', error.response?.status);
      }

      // 최근 경기 결과 조회
      try {
        const recentResponse = await axios.get(`${API_URL}/matches/team/${team.id}?limit=5`, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true
        });
        setRecentMatches(recentResponse.data?.filter(m => m.status === 'completed') || []);
      } catch (error) {
        console.log('최근 경기 조회 실패:', error.response?.status);
      }
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
          <Link to="/roster" className="action-btn">
            <span className="action-icon">📋</span>
            로스터
          </Link>
          <Link to="/scouts" className="action-btn">
            <span className="action-icon">🔍</span>
            스카우트
          </Link>
          <Link to="/agents" className="action-btn">
            <span className="action-icon">💼</span>
            에이전트
          </Link>
          <Link to="/events" className="action-btn">
            <span className="action-icon">📢</span>
            이벤트
          </Link>
          <Link to="/finances" className="action-btn">
            <span className="action-icon">💵</span>
            재정 관리
          </Link>
        </div>
      </div>

      {/* 경기 상황 - 2열 그리드 */}
      <div className="dashboard-section">
        <div className="matches-container">
          {/* 오늘의 경기 */}
          <div className="matches-column">
            <h2 className="section-title">⚽ 오늘의 경기</h2>
            {todayMatches.length > 0 ? (
              <div className="matches-list">
                {todayMatches.map(match => (
                  <div
                    key={match.id}
                    className="match-card"
                    onClick={() => setSelectedMatchId(match.id)}
                  >
                    <div className="match-teams">
                      <div className="match-team">
                        <span className="team-name">{match.home_team_name}</span>
                        <span className="team-score">{match.home_score ?? '-'}</span>
                      </div>
                      <div className="match-vs">VS</div>
                      <div className="match-team">
                        <span className="team-score">{match.away_score ?? '-'}</span>
                        <span className="team-name">{match.away_team_name}</span>
                      </div>
                    </div>
                    <div className="match-status">
                      {match.status === 'scheduled' ? '예정' : match.status === 'completed' ? '완료' : '진행중'}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-matches">오늘 예정된 경기가 없습니다.</div>
            )}
          </div>

          {/* 다음 스케줄 */}
          <div className="matches-column">
            <h2 className="section-title">📅 다음 스케줄</h2>
            {upcomingMatches.length > 0 ? (
              <div className="matches-list">
                {upcomingMatches.map(match => (
                  <div key={match.id} className="match-card">
                    <div className="match-teams">
                      <div className="match-team">
                        <span className="team-name">{match.home_team_name}</span>
                      </div>
                      <div className="match-vs">VS</div>
                      <div className="match-team">
                        <span className="team-name">{match.away_team_name}</span>
                      </div>
                    </div>
                    <div className="match-date">
                      {new Date(match.match_date).toLocaleDateString('ko-KR')}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-matches">예정된 경기가 없습니다.</div>
            )}
          </div>
        </div>
      </div>

      {/* 최근 경기 결과 */}
      {recentMatches.length > 0 && (
        <div className="dashboard-section">
          <h2 className="section-title">📊 최근 경기 결과</h2>
          <div className="matches-grid">
            {recentMatches.map(match => {
              const isHome = match.home_team_id === team.id;
              const myScore = isHome ? match.home_score : match.away_score;
              const oppScore = isHome ? match.away_score : match.home_score;
              const isWin = myScore > oppScore;
              
              return (
                <div key={match.id} className={`match-card ${isWin ? 'win' : 'loss'}`}>
                  <div className="match-teams">
                    <div className="match-team">
                      <span className="team-name">{match.home_team_name}</span>
                      <span className="team-score">{match.home_score}</span>
                    </div>
                    <div className="match-vs">VS</div>
                    <div className="match-team">
                      <span className="team-score">{match.away_score}</span>
                      <span className="team-name">{match.away_team_name}</span>
                    </div>
                  </div>
                  <div className="match-result">
                    {isWin ? '승리' : '패배'} ({myScore}-{oppScore})
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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

      {/* 경기 관전 모달 */}
      {selectedMatchId && (
        <MatchWatch
          matchId={selectedMatchId}
          onClose={() => setSelectedMatchId(null)}
        />
      )}
    </div>
  );
}

export default Dashboard;
