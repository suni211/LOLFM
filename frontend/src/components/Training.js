import React, { useState, useEffect } from 'react';
import axios from 'axios';
import authService from '../services/auth';
import './Training.css';

function Training({ team }) {
  const [players, setPlayers] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [trainingType, setTrainingType] = useState('mental');
  const [gameTime, setGameTime] = useState(null);
  const [trainingHistory, setTrainingHistory] = useState({});

  useEffect(() => {
    if (team) {
      loadPlayers();
      loadGameTime();
    }
  }, [team]);

  const loadGameTime = async () => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const response = await axios.get(`${API_URL}/game-time`, {
        withCredentials: true
      });
      setGameTime(response.data);
    } catch (error) {
      console.error('게임 시간 로드 오류:', error);
    }
  };

  const loadPlayers = async () => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const token = authService.getTokenValue();

      const response = await axios.get(`${API_URL}/players/team/${team.id}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true
      });
      setPlayers(response.data);
      
      // 각 선수의 훈련 기록 로드
      const history = {};
      for (const player of response.data) {
        try {
          const historyResponse = await axios.get(
            `${API_URL}/training/player/${player.id}/history`,
            {
              headers: { Authorization: `Bearer ${token}` },
              withCredentials: true
            }
          );
          history[player.id] = historyResponse.data;
        } catch (err) {
          history[player.id] = [];
        }
      }
      setTrainingHistory(history);
    } catch (error) {
      console.error('선수 로드 오류:', error);
    }
  };

  const handleTrain = async () => {
    if (!selectedPlayer) {
      window.alert('선수를 선택해주세요');
      return;
    }

    // 이번 달 훈련 여부 확인
    if (gameTime) {
      const playerHistory = trainingHistory[selectedPlayer.id] || [];
      const hasTrainedThisMonth = playerHistory.some(
        t => t.training_year === gameTime.current_year && 
             t.training_month === gameTime.current_month
      );
      
      if (hasTrainedThisMonth) {
        window.alert('이번 달에는 이미 훈련했습니다. 다음 달에 다시 시도해주세요.');
        return;
      }
    }

    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const token = authService.getTokenValue();

      const response = await axios.post(
        `${API_URL}/training/${selectedPlayer.id}`,
        { trainingType },
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true
        }
      );

      window.alert(`훈련이 완료되었습니다! ${response.data.statIncrease} 증가했습니다.`);
      loadPlayers();
    } catch (error) {
      window.alert(error.response?.data?.error || '훈련 실패');
    }
  };

  const trainingOptions = [
    { value: 'mental', label: '멘탈 훈련', icon: '🧠', stat: 'mental' },
    { value: 'teamfight', label: '한타 훈련', icon: '⚔️', stat: 'teamfight' },
    { value: 'laning', label: '라인전 훈련', icon: '🎯', stat: 'laning' },
    { value: 'cs', label: 'CS 훈련', icon: '💰', stat: 'cs_skill' },
    { value: 'leadership', label: '오더력 훈련', icon: '👑', stat: 'leadership' }
  ];

  return (
    <div className="training">
      <div className="page-header">
        <h1 className="page-title">선수 훈련</h1>
        <p className="page-subtitle">선수의 능력치를 향상시키세요</p>
      </div>

      <div className="training-layout">
        {/* 선수 목록 */}
        <div className="players-section">
          <h2 className="section-title">선수 목록</h2>
          <div className="players-grid">
            {players.map(player => (
              <div
                key={player.id}
                className={`player-card ${selectedPlayer?.id === player.id ? 'selected' : ''}`}
                onClick={() => setSelectedPlayer(player)}
              >
                <div className="player-header">
                  <div className="player-position">{player.position}</div>
                  <div className="player-name">{player.name}</div>
                </div>
                <div className="player-stats">
                  <div className="stat-mini">
                    <span>종합: {player.overall}</span>
                  </div>
                  <div className="stat-mini">
                    <span>컨디션: {player.condition}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 훈련 선택 */}
        <div className="training-section">
          <h2 className="section-title">훈련 선택</h2>
          {selectedPlayer ? (
            <>
              <div className="selected-player-info">
                <h3>{selectedPlayer.name}</h3>
                <div className="player-details">
                  <div className="detail-row">
                    <span>포지션:</span>
                    <span>{selectedPlayer.position}</span>
                  </div>
                  <div className="detail-row">
                    <span>종합 능력치:</span>
                    <span className="highlight">{selectedPlayer.overall}</span>
                  </div>
                  <div className="detail-row">
                    <span>컨디션:</span>
                    <span className={selectedPlayer.condition < 50 ? 'warning' : ''}>{selectedPlayer.condition}%</span>
                  </div>
                  {gameTime && (() => {
                    const playerHistory = trainingHistory[selectedPlayer.id] || [];
                    const hasTrainedThisMonth = playerHistory.some(
                      t => t.training_year === gameTime.current_year && 
                           t.training_month === gameTime.current_month
                    );
                    return (
                      <div className="detail-row">
                        <span>이번 달 훈련:</span>
                        <span className={hasTrainedThisMonth ? 'warning' : 'success'}>
                          {hasTrainedThisMonth ? '완료' : '가능'}
                        </span>
                      </div>
                    );
                  })()}
                </div>
              </div>

              <div className="training-options">
                {trainingOptions.map(option => (
                  <div
                    key={option.value}
                    className={`training-option ${trainingType === option.value ? 'selected' : ''}`}
                    onClick={() => setTrainingType(option.value)}
                  >
                    <span className="option-icon">{option.icon}</span>
                    <div className="option-info">
                      <div className="option-label">{option.label}</div>
                      <div className="option-stat">
                        현재: {selectedPlayer[option.stat] || 0}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button className="train-btn" onClick={handleTrain}>
                훈련 시작
              </button>
            </>
          ) : (
            <div className="no-selection">
              선수를 선택해주세요
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Training;

