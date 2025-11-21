import React, { useState, useEffect } from 'react';
import axios from 'axios';
import authService from '../services/auth';
import './MatchWatch.css';

function MatchWatch({ matchId, onClose }) {
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);

  useEffect(() => {
    loadMatch();
  }, [matchId]);

  const loadMatch = async () => {
    try {
      setLoading(true);
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const token = authService.getTokenValue();
      
      const response = await axios.get(`${API_URL}/matches/${matchId}/watch`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true
      });
      
      setMatch(response.data);
    } catch (error) {
      console.error('경기 로드 오류:', error);
      window.alert('경기를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSimulate = async () => {
    if (match.status === 'completed') {
      window.alert('이미 완료된 경기입니다.');
      return;
    }

    setSimulating(true);
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const token = authService.getTokenValue();
      
      await axios.post(`${API_URL}/matches/${matchId}/simulate`, {}, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true
      });
      
      // 경기 정보 다시 로드
      await loadMatch();
    } catch (error) {
      console.error('경기 시뮬레이션 오류:', error);
      window.alert(error.response?.data?.error || '경기 시뮬레이션 실패');
    } finally {
      setSimulating(false);
    }
  };

  if (loading) {
    return (
      <div className="match-watch-overlay">
        <div className="match-watch-container">
          <div className="loading">경기 정보를 불러오는 중...</div>
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="match-watch-overlay">
        <div className="match-watch-container">
          <div className="error">경기를 찾을 수 없습니다.</div>
          <button onClick={onClose} className="close-btn">닫기</button>
        </div>
      </div>
    );
  }

  const isHomeWin = match.home_score > match.away_score;
  const isAwayWin = match.away_score > match.home_score;
  const isDraw = match.home_score === match.away_score;

  return (
    <div className="match-watch-overlay" onClick={onClose}>
      <div className="match-watch-container" onClick={(e) => e.stopPropagation()}>
        <div className="match-header">
          <h2 className="match-title">경기 관전</h2>
          <button onClick={onClose} className="close-btn">✕</button>
        </div>

        <div className="match-info">
          <div className="league-name">{match.league_name || '리그 경기'}</div>
          <div className="match-date">
            {new Date(match.match_date).toLocaleDateString('ko-KR')}
          </div>
        </div>

        <div className="match-score">
          <div className={`team-section home ${isHomeWin ? 'winner' : ''}`}>
            <div className="team-logo">
              {match.home_team_logo ? (
                <img src={match.home_team_logo} alt={match.home_team_name} />
              ) : (
                <div className="logo-placeholder">🏟️</div>
              )}
            </div>
            <div className="team-name">{match.home_team_name}</div>
            <div className="team-score">{match.home_score ?? '-'}</div>
          </div>

          <div className="vs-divider">VS</div>

          <div className={`team-section away ${isAwayWin ? 'winner' : ''}`}>
            <div className="team-logo">
              {match.away_team_logo ? (
                <img src={match.away_team_logo} alt={match.away_team_name} />
              ) : (
                <div className="logo-placeholder">🏟️</div>
              )}
            </div>
            <div className="team-name">{match.away_team_name}</div>
            <div className="team-score">{match.away_score ?? '-'}</div>
          </div>
        </div>

        {match.status === 'scheduled' && (
          <div className="match-actions">
            <button 
              onClick={handleSimulate} 
              className="simulate-btn"
              disabled={simulating}
            >
              {simulating ? '경기 진행 중...' : '경기 시작'}
            </button>
          </div>
        )}

        {match.status === 'completed' && (
          <div className="match-result">
            <div className={`result-badge ${isHomeWin ? 'home-win' : isAwayWin ? 'away-win' : 'draw'}`}>
              {isHomeWin ? `${match.home_team_name} 승리` : 
               isAwayWin ? `${match.away_team_name} 승리` : '무승부'}
            </div>
            <div className="result-details">
              <div>홈팀: {match.home_score}승</div>
              <div>원정팀: {match.away_score}승</div>
            </div>
          </div>
        )}

        {match.simulation && (
          <div className="simulation-info">
            <div className="power-comparison">
              <div>홈팀 전력: {match.simulation.homeTeamPower}</div>
              <div>원정팀 전력: {match.simulation.awayTeamPower}</div>
            </div>
          </div>
        )}

        {match.status === 'completed' && (
          <div className="match-highlights">
            <h3 className="highlights-title">경기 하이라이트</h3>
            <div className="highlights-list">
              {match.home_score > 0 && (
                <div className="highlight-item">
                  <span className="highlight-icon">⚡</span>
                  <div className="highlight-text">
                    <strong>{match.home_team_name}</strong>이(가) {match.home_score}번째 게임에서 승리했습니다!
                  </div>
                </div>
              )}
              {match.away_score > 0 && (
                <div className="highlight-item">
                  <span className="highlight-icon">⚡</span>
                  <div className="highlight-text">
                    <strong>{match.away_team_name}</strong>이(가) {match.away_score}번째 게임에서 승리했습니다!
                  </div>
                </div>
              )}
              {match.home_score === 2 && (
                <div className="highlight-item victory">
                  <span className="highlight-icon">🏆</span>
                  <div className="highlight-text">
                    <strong>{match.home_team_name}</strong>이(가) 시리즈를 2-{match.away_score}로 승리했습니다!
                  </div>
                </div>
              )}
              {match.away_score === 2 && (
                <div className="highlight-item victory">
                  <span className="highlight-icon">🏆</span>
                  <div className="highlight-text">
                    <strong>{match.away_team_name}</strong>이(가) 시리즈를 2-{match.home_score}로 승리했습니다!
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MatchWatch;

