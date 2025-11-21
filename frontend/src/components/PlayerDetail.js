import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import authService from '../services/auth';
import './PlayerDetail.css';

function PlayerDetail() {
  const { playerId } = useParams();
  const navigate = useNavigate();
  const [player, setPlayer] = useState(null);
  const [trainingHistory, setTrainingHistory] = useState([]);
  const [matchStats, setMatchStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlayerData();
  }, [playerId]);

  const loadPlayerData = async () => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const token = authService.getTokenValue();

      // 선수 정보
      const playerResponse = await axios.get(`${API_URL}/players/${playerId}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true
      });
      setPlayer(playerResponse.data);

      // 훈련 기록
      try {
        const trainingResponse = await axios.get(`${API_URL}/training/player/${playerId}/history`, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true
        });
        setTrainingHistory(trainingResponse.data || []);
      } catch (err) {
        setTrainingHistory([]);
      }

      // 경기 통계
      try {
        const statsResponse = await axios.get(`${API_URL}/players/${playerId}/stats`, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true
        });
        setMatchStats(statsResponse.data);
      } catch (err) {
        setMatchStats(null);
      }
    } catch (error) {
      console.error('선수 정보 로드 오류:', error);
      window.alert('선수 정보를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="player-detail-loading">로딩 중...</div>;
  }

  if (!player) {
    return (
      <div className="player-detail">
        <div className="error">선수를 찾을 수 없습니다.</div>
        <button onClick={() => navigate(-1)} className="back-btn">돌아가기</button>
      </div>
    );
  }

  const stats = [
    { label: '멘탈', value: player.mental, max: 100 },
    { label: '한타력', value: player.teamfight, max: 100 },
    { label: '라인전', value: player.laning, max: 100 },
    { label: '정글링', value: player.jungling, max: 100 },
    { label: 'CS 수급', value: player.cs_skill, max: 100 },
    { label: '컨디션', value: player.condition, max: 100 },
    { label: '리더십', value: player.leadership, max: 100 },
    { label: '의지', value: player.will, max: 100 },
    { label: '승부욕', value: player.competitiveness, max: 100 },
    { label: '더티 플레이', value: player.dirty_play, max: 100 }
  ];

  return (
    <div className="player-detail">
      <div className="player-header">
        <button onClick={() => navigate(-1)} className="back-btn">← 돌아가기</button>
        <h1 className="player-title">선수 상세 정보</h1>
      </div>

      <div className="player-info-card">
        <div className="player-basic-info">
          <div className="player-avatar">
            {player.name.charAt(0)}
          </div>
          <div className="player-info">
            <h2 className="player-name">{player.name}</h2>
            <div className="player-meta">
              <span className="position-badge">{player.position}</span>
              <span className="nationality">{player.nationality}</span>
              <span className="age">나이: {player.age}세</span>
            </div>
            <div className="player-overall">
              <span className="overall-label">종합 능력치</span>
              <span className="overall-value">{player.overall}</span>
            </div>
          </div>
        </div>

        <div className="player-contract">
          <h3>계약 정보</h3>
          <div className="contract-details">
            <div>급여: {player.salary?.toLocaleString() || 0}원</div>
            <div>계약 시작: {player.contract_start ? new Date(player.contract_start).toLocaleDateString() : '-'}</div>
            <div>계약 종료: {player.contract_end ? new Date(player.contract_end).toLocaleDateString() : '-'}</div>
          </div>
        </div>
      </div>

      <div className="stats-section">
        <h3 className="section-title">능력치</h3>
        <div className="stats-grid">
          {stats.map((stat, index) => (
            <div key={index} className="stat-item">
              <div className="stat-header">
                <span className="stat-label">{stat.label}</span>
                <span className="stat-value">{stat.value}</span>
              </div>
              <div className="stat-bar">
                <div 
                  className="stat-fill" 
                  style={{ width: `${(stat.value / stat.max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {trainingHistory.length > 0 && (
        <div className="training-history-section">
          <h3 className="section-title">훈련 기록</h3>
          <div className="training-list">
            {trainingHistory.map((training, index) => (
              <div key={index} className="training-item">
                <div className="training-type">{training.training_type}</div>
                <div className="training-date">
                  {training.training_year}년 {training.training_month}월
                </div>
                <div className="training-increase">+{training.stat_increase}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {matchStats && (
        <div className="match-stats-section">
          <h3 className="section-title">경기 통계</h3>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-card-label">출전 경기</div>
              <div className="stat-card-value">{matchStats.total_matches || 0}</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-label">승률</div>
              <div className="stat-card-value">{matchStats.win_rate || 0}%</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-label">평균 KDA</div>
              <div className="stat-card-value">{matchStats.avg_kda || 0}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PlayerDetail;

