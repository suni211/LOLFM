import React, { useState, useEffect } from 'react';
import axios from 'axios';
import authService from '../services/auth';
import './LeagueStandings.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function LeagueStandings({ leagueId }) {
  const [standings, setStandings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (leagueId) {
      loadStandings();
    } else {
      setError('리그 정보가 없습니다.');
      setLoading(false);
    }
  }, [leagueId]);

  const loadStandings = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = authService.getTokenValue();
      const response = await axios.get(`${API_URL}/matches/league/${leagueId}/standings`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true
      });
      setStandings(response.data || []);
    } catch (error) {
      console.error('순위 로드 오류:', error);
      setError('리그 순위를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="league-standings">
        <div className="loading">로딩 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="league-standings">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  if (standings.length === 0) {
    return (
      <div className="league-standings">
        <h2>리그 순위</h2>
        <div className="no-data">아직 순위 데이터가 없습니다.</div>
      </div>
    );
  }

  return (
    <div className="league-standings">
      <div className="page-header">
        <h1 className="page-title">리그 순위</h1>
        <p className="page-subtitle">현재 시즌 리그 순위표</p>
      </div>
      <div className="standings-container">
        <table className="standings-table">
          <thead>
            <tr>
              <th>순위</th>
              <th>팀명</th>
              <th>승</th>
              <th>패</th>
              <th>무</th>
              <th>승점</th>
              <th>득실차</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((standing, index) => (
              <tr key={standing.id || index} className={index < 4 ? 'playoff-spot' : ''}>
                <td className="rank-cell">{standing.rank || index + 1}</td>
                <td className="team-name-cell">{standing.team_name || '알 수 없음'}</td>
                <td>{standing.wins || 0}</td>
                <td>{standing.losses || 0}</td>
                <td>{standing.draws || 0}</td>
                <td><strong>{standing.points || 0}</strong></td>
                <td>{standing.goal_difference > 0 ? '+' : ''}{standing.goal_difference || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default LeagueStandings;

