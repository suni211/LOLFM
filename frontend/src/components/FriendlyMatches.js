import React, { useState, useEffect } from 'react';
import axios from 'axios';
import authService from '../services/auth';
import './FriendlyMatches.css';

const FriendlyMatches = ({ team }) => {
  const [opponents, setOpponents] = useState([]);
  const [friendlyMatches, setFriendlyMatches] = useState([]);
  const [selectedOpponent, setSelectedOpponent] = useState(null);
  const [matchDate, setMatchDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    if (team) {
      loadOpponents();
      loadFriendlyMatches();
    }
  }, [team]);

  const loadOpponents = async () => {
    try {
      const token = authService.getTokenValue();
      const response = await axios.get(`${API_URL}/friendly-matches/opponents/${team.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOpponents(response.data);
    } catch (error) {
      console.error('상대팀 로드 오류:', error);
      setMessage('상대팀 목록을 불러오는데 실패했습니다.');
    }
  };

  const loadFriendlyMatches = async () => {
    try {
      const token = authService.getTokenValue();
      const response = await axios.get(`${API_URL}/friendly-matches/team/${team.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFriendlyMatches(response.data);
    } catch (error) {
      console.error('친선 경기 목록 로드 오류:', error);
    }
  };

  const handleCreateMatch = async () => {
    if (!selectedOpponent || !matchDate) {
      setMessage('상대팀과 경기 날짜를 선택해주세요.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const token = authService.getTokenValue();
      await axios.post(
        `${API_URL}/friendly-matches/create`,
        {
          team1Id: team.id,
          team2Id: selectedOpponent,
          matchDate: matchDate
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setMessage('친선 경기가 생성되었습니다!');
      setSelectedOpponent(null);
      setMatchDate('');
      loadFriendlyMatches();
    } catch (error) {
      console.error('친선 경기 생성 오류:', error);
      setMessage(error.response?.data?.error || '친선 경기 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateMatch = async (matchId) => {
    setLoading(true);
    try {
      const token = authService.getTokenValue();
      await axios.post(
        `${API_URL}/friendly-matches/${matchId}/simulate`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setMessage('경기가 시뮬레이션되었습니다!');
      loadFriendlyMatches();
    } catch (error) {
      console.error('경기 시뮬레이션 오류:', error);
      setMessage(error.response?.data?.error || '경기 시뮬레이션에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR');
  };

  const getMatchResult = (match) => {
    if (match.status !== 'completed') return '예정';
    const isHome = match.home_team_id === team.id;
    const myScore = isHome ? match.home_score : match.away_score;
    const oppScore = isHome ? match.away_score : match.home_score;
    
    if (myScore > oppScore) return `승리 (${myScore}-${oppScore})`;
    if (myScore < oppScore) return `패배 (${myScore}-${oppScore})`;
    return `무승부 (${myScore}-${oppScore})`;
  };

  return (
    <div className="friendly-matches-container">
      <h2>친선 경기</h2>
      <p className="description">다른 팀과 친선 경기를 통해 실력을 확인하세요. 친선 경기는 리그 순위에 영향을 주지 않습니다.</p>

      {message && (
        <div className={`message ${message.includes('성공') || message.includes('생성') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <div className="friendly-matches-content">
        {/* 친선 경기 생성 */}
        <div className="create-match-section">
          <h3>친선 경기 생성</h3>
          <div className="form-group">
            <label>상대팀 선택</label>
            <select
              value={selectedOpponent || ''}
              onChange={(e) => setSelectedOpponent(e.target.value)}
              disabled={loading}
            >
              <option value="">상대팀을 선택하세요</option>
              {opponents.map((opponent) => (
                <option key={opponent.id} value={opponent.id}>
                  {opponent.name} ({opponent.league_name || '리그 없음'}) - 선수 {opponent.player_count}명
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>경기 날짜</label>
            <input
              type="date"
              value={matchDate}
              onChange={(e) => setMatchDate(e.target.value)}
              disabled={loading}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <button
            onClick={handleCreateMatch}
            disabled={loading || !selectedOpponent || !matchDate}
            className="create-btn"
          >
            {loading ? '생성 중...' : '친선 경기 생성'}
          </button>
        </div>

        {/* 친선 경기 목록 */}
        <div className="matches-list-section">
          <h3>친선 경기 목록</h3>
          {friendlyMatches.length === 0 ? (
            <p className="no-matches">친선 경기가 없습니다.</p>
          ) : (
            <div className="matches-list">
              {friendlyMatches.map((match) => (
                <div key={match.id} className="match-card">
                  <div className="match-teams">
                    <div className="team-info">
                      <span className={match.home_team_id === team.id ? 'my-team' : ''}>
                        {match.home_team_name}
                      </span>
                      <span className="vs">VS</span>
                      <span className={match.away_team_id === team.id ? 'my-team' : ''}>
                        {match.away_team_name}
                      </span>
                    </div>
                  </div>
                  <div className="match-info">
                    <div className="match-date">{formatDate(match.match_date)}</div>
                    <div className="match-status">
                      {match.status === 'completed' ? (
                        <span className="result">{getMatchResult(match)}</span>
                      ) : (
                        <button
                          onClick={() => handleSimulateMatch(match.id)}
                          disabled={loading}
                          className="simulate-btn"
                        >
                          경기 진행
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FriendlyMatches;

