import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './TeamManagement.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function TeamManagement({ team }) {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlayers();
  }, [team]);

  const loadPlayers = async () => {
    try {
      const response = await axios.get(`${API_URL}/players/team/${team.id}`, { withCredentials: true });
      setPlayers(response.data);
      setLoading(false);
    } catch (error) {
      console.error('선수 로드 오류:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">로딩 중...</div>;
  }

  return (
    <div className="team-management">
      <h2>팀 관리</h2>
      <div className="players-grid">
        {players.map(player => (
          <div key={player.id} className="player-card">
            <div className="player-header">
              <h3>{player.name}</h3>
              <span className="position-badge">{player.position}</span>
            </div>
            <div className="player-stats">
              <div className="stat-row">
                <span>오버롤:</span>
                <strong>{player.overall}</strong>
              </div>
              <div className="stat-row">
                <span>포텐셜:</span>
                <strong>{player.potential}</strong>
              </div>
              <div className="stat-row">
                <span>컨디션:</span>
                <strong>{player.condition}</strong>
              </div>
              <div className="stat-row">
                <span>주급:</span>
                <strong>{player.salary?.toLocaleString()}원</strong>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TeamManagement;

