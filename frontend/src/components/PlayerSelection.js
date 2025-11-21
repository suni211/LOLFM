import React, { useState, useEffect } from 'react';
import axios from 'axios';
import authService from '../services/auth';
import './PlayerSelection.css';

function PlayerSelection({ team, onComplete }) {
  const [currentPosition, setCurrentPosition] = useState(0);
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [availablePlayers, setAvailablePlayers] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const positions = ['TOP', 'JGL', 'MID', 'ADC', 'SPT'];

  useEffect(() => {
    loadPlayersForPosition();
  }, [currentPosition]);

  const loadPlayersForPosition = async () => {
    setLoading(true);
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const token = authService.getTokenValue();
      
      const response = await axios.get(
        `${API_URL}/players/free-agents/${positions[currentPosition]}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true
        }
      );
      
      setAvailablePlayers(response.data);
    } catch (error) {
      console.error('선수 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlayer = async (player) => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const token = authService.getTokenValue();
      
      await axios.post(
        `${API_URL}/players/recruit`,
        { playerId: player.id, teamId: team.id },
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true
        }
      );
      
      setSelectedPlayers([...selectedPlayers, player]);
      
      if (currentPosition < positions.length - 1) {
        setCurrentPosition(currentPosition + 1);
      } else {
        onComplete();
      }
    } catch (error) {
      console.error('선수 선택 오류:', error);
      window.alert('선수 선택에 실패했습니다.');
    }
  };

  return (
    <div className="player-selection">
      <div className="selection-header">
        <h1 className="selection-title">선수 선택</h1>
        <p className="selection-subtitle">
          {positions[currentPosition]} 포지션 선수를 선택하세요 ({currentPosition + 1}/5)
        </p>
      </div>

      <div className="progress-bar">
        {positions.map((pos, idx) => (
          <div
            key={pos}
            className={`progress-step ${idx < currentPosition ? 'completed' : ''} ${idx === currentPosition ? 'active' : ''}`}
          >
            {pos}
          </div>
        ))}
      </div>

      <div className="players-grid">
        {loading ? (
          <div className="loading">선수 정보를 불러오는 중...</div>
        ) : (
          availablePlayers.map(player => (
            <div
              key={player.id}
              className="player-card"
              onClick={() => handleSelectPlayer(player)}
            >
              <div className="player-position-badge">{player.position}</div>
              <h3 className="player-name">{player.name}</h3>
              <div className="player-nationality">{player.nationality}</div>
              
              <div className="player-stats">
                <div className="stat-row">
                  <span>종합:</span>
                  <span className="stat-value">{player.overall}</span>
                </div>
                <div className="stat-row">
                  <span>포텐셜:</span>
                  <span className="stat-value potential">{player.potential}</span>
                </div>
                <div className="stat-row">
                  <span>예상 급여:</span>
                  <span className="stat-value">
                    {(player.overall * 100000).toLocaleString()}원
                  </span>
                </div>
              </div>

              <div className="player-details">
                <div className="detail-stat">
                  <span>멘탈: {player.mental}</span>
                  <span>한타: {player.teamfight}</span>
                </div>
                <div className="detail-stat">
                  <span>라인: {player.laning}</span>
                  <span>CS: {player.cs_skill}</span>
                </div>
              </div>

              <button className="select-btn">선택하기</button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default PlayerSelection;

