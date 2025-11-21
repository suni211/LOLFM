import React, { useState, useEffect } from 'react';
import axios from 'axios';
import authService from '../services/auth';
import './PlayerSelection.css';

function PlayerSelection({ team, onComplete }) {
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [playerPool, setPlayerPool] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const positions = ['TOP', 'JGL', 'MID', 'ADC', 'SPT'];

  useEffect(() => {
    loadInitialPool();
  }, []);

  const loadInitialPool = async () => {
    setLoading(true);
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const token = authService.getTokenValue();
      
      const response = await axios.get(
        `${API_URL}/players/initial-pool`,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true
        }
      );
      
      setPlayerPool(response.data);
    } catch (error) {
      console.error('선수 풀 로드 오류:', error);
      window.alert('선수 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePlayer = (player) => {
    const isSelected = selectedPlayers.some(p => p.id === player.id);
    
    if (isSelected) {
      setSelectedPlayers(selectedPlayers.filter(p => p.id !== player.id));
    } else {
      if (selectedPlayers.length >= 5) {
        window.alert('최대 5명까지만 선택할 수 있습니다.');
        return;
      }
      setSelectedPlayers([...selectedPlayers, player]);
    }
  };

  const handleSubmit = async () => {
    if (selectedPlayers.length !== 5) {
      window.alert('정확히 5명의 선수를 선택해야 합니다.');
      return;
    }
    
    setSubmitting(true);
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const token = authService.getTokenValue();
      
      await axios.post(
        `${API_URL}/players/initial-select`,
        { 
          teamId: team.id, 
          playerIds: selectedPlayers.map(p => p.id) 
        },
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true
        }
      );
      
      window.alert('선수 선택이 완료되었습니다!');
      onComplete();
    } catch (error) {
      console.error('선수 선택 오류:', error);
      window.alert(error.response?.data?.error || '선수 선택에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="player-selection">
        <div className="loading">선수 정보를 불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className="player-selection">
      <div className="selection-header">
        <h1 className="selection-title">🎮 초기 선수 선택</h1>
        <p className="selection-subtitle">
          5명의 선수를 선택하세요 (무료) - 선택됨: {selectedPlayers.length}/5
        </p>
      </div>

      <div className="selected-players">
        <h3>선택한 선수 ({selectedPlayers.length}명)</h3>
        <div className="selected-list">
          {selectedPlayers.map(player => (
            <div key={player.id} className="selected-player">
              <span className="pos-badge">{player.position}</span>
              <span className="player-name">{player.name}</span>
              <span className="overall">{player.overall}</span>
            </div>
          ))}
        </div>
        <button 
          className="submit-btn" 
          onClick={handleSubmit}
          disabled={selectedPlayers.length !== 5 || submitting}
        >
          {submitting ? '처리 중...' : '선수 선택 완료'}
        </button>
      </div>

      {positions.map(position => (
        <div key={position} className="position-section">
          <h2 className="position-title">{position} 포지션</h2>
          <div className="players-grid">
            {(playerPool[position] || []).map(player => {
              const isSelected = selectedPlayers.some(p => p.id === player.id);
              return (
                <div
                  key={player.id}
                  className={`player-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleTogglePlayer(player)}
                >
                  <div className="player-position-badge">{player.position}</div>
                  {isSelected && <div className="selected-check">✓</div>}
                  <h3 className="player-name">{player.name}</h3>
                  <div className="player-info">
                    <span className="player-age">나이: {player.age}</span>
                    <span className="player-nationality">{player.nationality}</span>
                  </div>
                  
                  <div className="player-stats">
                    <div className="stat-row main">
                      <span>종합 능력</span>
                      <span className="stat-value">{player.overall}</span>
                    </div>
                  </div>

                  <div className="player-details">
                    <div className="detail-row">
                      <span>멘탈: {player.mental}</span>
                      <span>한타: {player.teamfight}</span>
                    </div>
                    <div className="detail-row">
                      <span>라인: {player.laning}</span>
                      <span>CS: {player.cs_skill}</span>
                    </div>
                    <div className="detail-row">
                      <span>리더십: {player.leadership}</span>
                      <span>의지: {player.will}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export default PlayerSelection;

