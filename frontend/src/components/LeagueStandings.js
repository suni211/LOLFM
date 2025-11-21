import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './LeagueStandings.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function LeagueStandings({ leagueId }) {
  const [standings, setStandings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (leagueId) {
      loadStandings();
    }
  }, [leagueId]);

  const loadStandings = async () => {
    try {
      const response = await axios.get(`${API_URL}/matches/league/${leagueId}/standings`, { withCredentials: true });
      setStandings(response.data);
      setLoading(false);
    } catch (error) {
      console.error('순위 로드 오류:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">로딩 중...</div>;
  }

  return (
    <div className="league-standings">
      <h2>리그 순위</h2>
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
            <tr key={standing.id} className={index < 4 ? 'playoff-spot' : ''}>
              <td>{standing.rank}</td>
              <td>{standing.team_name}</td>
              <td>{standing.wins}</td>
              <td>{standing.losses}</td>
              <td>{standing.draws || 0}</td>
              <td><strong>{standing.points}</strong></td>
              <td>{standing.goal_difference > 0 ? '+' : ''}{standing.goal_difference}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default LeagueStandings;

