import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import authService from '../services/auth';
import './Roster.css';

const Roster = ({ team }) => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState('');

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  const positions = ['TOP', 'JGL', 'MID', 'ADC', 'SPT'];

  useEffect(() => {
    if (team) {
      loadPlayers();
    }
  }, [team]);

  const loadPlayers = async () => {
    setLoading(true);
    try {
      const token = authService.getTokenValue();
      const response = await axios.get(`${API_URL}/players/team/${team.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPlayers(response.data || []);
    } catch (error) {
      console.error('선수 목록 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPlayersByPosition = (position) => {
    return players.filter(p => p.position === position);
  };

  const formatMoney = (amount) => {
    if (amount >= 100000000) {
      return `${(amount / 100000000).toFixed(1)}억`;
    } else if (amount >= 10000) {
      return `${(amount / 10000).toFixed(0)}만`;
    }
    return amount?.toLocaleString() || '0';
  };

  if (loading) {
    return (
      <div className="roster-container">
        <div className="loading">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="roster-container">
      <div className="roster-header">
        <h2>로스터</h2>
        <div className="roster-stats">
          <span>총 {players.length}명</span>
        </div>
      </div>

      {/* 포지션 필터 */}
      <div className="position-filter">
        <button
          className={selectedPosition === '' ? 'active' : ''}
          onClick={() => setSelectedPosition('')}
        >
          전체
        </button>
        {positions.map(pos => (
          <button
            key={pos}
            className={selectedPosition === pos ? 'active' : ''}
            onClick={() => setSelectedPosition(pos)}
          >
            {pos}
          </button>
        ))}
      </div>

      {/* 포지션별 선수 목록 */}
      <div className="roster-content">
        {positions.map(position => {
          const positionPlayers = getPlayersByPosition(position);
          if (selectedPosition && selectedPosition !== position) return null;
          if (positionPlayers.length === 0) return null;

          return (
            <div key={position} className="position-section">
              <h3 className="position-title">{position}</h3>
              <div className="players-grid">
                {positionPlayers.map(player => (
                  <Link
                    key={player.id}
                    to={`/players/${player.id}`}
                    className="player-card"
                  >
                    <div className="player-header">
                      <div className="player-name">{player.name}</div>
                      <div className="player-overall">{player.overall}</div>
                    </div>
                    <div className="player-info">
                      <div className="player-detail">
                        <span>나이:</span>
                        <span>{player.age}세</span>
                      </div>
                      <div className="player-detail">
                        <span>국적:</span>
                        <span>{player.nationality}</span>
                      </div>
                      <div className="player-detail">
                        <span>급여:</span>
                        <span>{formatMoney(player.salary)}</span>
                      </div>
                    </div>
                    <div className="player-stats">
                      <div className="stat-item">
                        <span className="stat-label">멘탈</span>
                        <span className="stat-value">{player.mental}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">한타</span>
                        <span className="stat-value">{player.teamfight}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">라인전</span>
                        <span className="stat-value">{player.laning}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">CS</span>
                        <span className="stat-value">{player.cs_skill}</span>
                      </div>
                    </div>
                    <div className="player-condition">
                      컨디션: {player.condition}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {players.length === 0 && (
        <div className="no-players">
          선수가 없습니다. 팀 관리에서 선수를 영입하세요.
        </div>
      )}
    </div>
  );
};

export default Roster;

