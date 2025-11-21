import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import authService from '../services/auth';
import './TeamManagement.css';

function TeamManagement({ team }) {
  const navigate = useNavigate();
  const [players, setPlayers] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formation, setFormation] = useState({
    TOP: null,
    JGL: null,
    MID: null,
    ADC: null,
    SPT: null
  });

  useEffect(() => {
    if (team) {
      loadPlayers();
    }
  }, [team]);

  const loadPlayers = async () => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const token = authService.getTokenValue();
      
      const response = await axios.get(`${API_URL}/players/team/${team.id}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true
      });
      
      setPlayers(response.data);
      
      // 포메이션 자동 설정 (각 포지션별 최고 overall 선수)
      const posGroups = {};
      response.data.forEach(player => {
        if (!posGroups[player.position] || posGroups[player.position].overall < player.overall) {
          posGroups[player.position] = player;
        }
      });
      setFormation(posGroups);
    } catch (error) {
      console.error('선수 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSetFormation = (position, playerId) => {
    setFormation(prev => ({
      ...prev,
      [position]: playerId
    }));
  };

  const handleReleasePlayer = async (playerId) => {
    if (!window.confirm('정말 이 선수를 방출하시겠습니까?')) return;

    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const token = authService.getTokenValue();
      
      await axios.post(`${API_URL}/players/${playerId}/release`, {}, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true
      });
      
      window.alert('선수가 방출되었습니다.');
      loadPlayers();
    } catch (error) {
      window.alert(error.response?.data?.error || '선수 방출 실패');
    }
  };

  const handleSaveFormation = async () => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const token = authService.getTokenValue();
      
      await axios.post(`${API_URL}/teams/${team.id}/formation`, formation, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true
      });
      
      window.alert('포메이션이 저장되었습니다.');
    } catch (error) {
      window.alert(error.response?.data?.error || '포메이션 저장 실패');
    }
  };

  const positions = ['TOP', 'JGL', 'MID', 'ADC', 'SPT'];
  const positionNames = {
    TOP: '탑',
    JGL: '정글',
    MID: '미드',
    ADC: '원딜',
    SPT: '서폿'
  };

  if (loading) {
    return <div className="team-management-loading">로딩 중...</div>;
  }

  return (
    <div className="team-management">
      <div className="page-header">
        <h1 className="page-title">👥 팀 관리</h1>
        <p className="page-subtitle">선수 관리 및 포메이션 설정</p>
      </div>

      {/* 포메이션 설정 */}
      <div className="formation-section">
        <h2 className="section-title">포메이션</h2>
        <div className="formation-grid">
          {positions.map(position => {
            const player = players.find(p => p.id === formation[position]);
            return (
              <div key={position} className="formation-slot">
                <div className="slot-position">{positionNames[position]}</div>
                <select
                  value={formation[position] || ''}
                  onChange={(e) => handleSetFormation(position, e.target.value ? parseInt(e.target.value) : null)}
                  className="formation-select"
                >
                  <option value="">선택 안함</option>
                  {players
                    .filter(p => p.position === position)
                    .map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} (OVR: {p.overall})
                      </option>
                    ))}
                </select>
                {player && (
                  <div className="slot-player-info">
                    <div>{player.name}</div>
                    <div className="player-ovr">OVR: {player.overall}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <button onClick={handleSaveFormation} className="save-formation-btn">
          포메이션 저장
        </button>
      </div>

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
                <div className="player-position-badge">{player.position}</div>
                <h3 className="player-name">{player.name}</h3>
              </div>
              
              <div className="player-stats">
                <div className="stat-row">
                  <span>종합:</span>
                  <span className="stat-value">{player.overall}</span>
                </div>
                <div className="stat-row">
                  <span>컨디션:</span>
                  <span className={`stat-value ${player.condition < 50 ? 'low' : ''}`}>
                    {player.condition}%
                  </span>
                </div>
                <div className="stat-row">
                  <span>급여:</span>
                  <span className="stat-value">
                    {player.salary ? (player.salary / 10000).toFixed(0) + '만' : '0'}원
                  </span>
                </div>
              </div>

              <div className="player-actions">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/players/${player.id}`);
                  }}
                  className="detail-btn"
                >
                  상세보기
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReleasePlayer(player.id);
                  }}
                  className="release-btn"
                >
                  방출
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 선택된 선수 상세 */}
      {selectedPlayer && (
        <div className="selected-player-detail">
          <h3>{selectedPlayer.name} 상세 정보</h3>
          <div className="detail-stats">
            <div className="detail-stat">
              <span>멘탈:</span>
              <span>{selectedPlayer.mental}</span>
            </div>
            <div className="detail-stat">
              <span>한타:</span>
              <span>{selectedPlayer.teamfight}</span>
            </div>
            <div className="detail-stat">
              <span>라인전:</span>
              <span>{selectedPlayer.laning}</span>
            </div>
            <div className="detail-stat">
              <span>CS:</span>
              <span>{selectedPlayer.cs_skill}</span>
            </div>
            <div className="detail-stat">
              <span>리더십:</span>
              <span>{selectedPlayer.leadership}</span>
            </div>
            <div className="detail-stat">
              <span>의지:</span>
              <span>{selectedPlayer.will}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeamManagement;
