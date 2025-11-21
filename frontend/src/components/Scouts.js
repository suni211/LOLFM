import React, { useState, useEffect } from 'react';
import axios from 'axios';
import authService from '../services/auth';
import './Scouts.css';

const Scouts = ({ team }) => {
  const [scouts, setScouts] = useState([]);
  const [scoutResults, setScoutResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [newScoutName, setNewScoutName] = useState('');
  const [newScoutLevel, setNewScoutLevel] = useState(1);
  const [selectedPosition, setSelectedPosition] = useState('');

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    if (team) {
      loadScouts();
      loadScoutResults();
    }
  }, [team]);

  const loadScouts = async () => {
    try {
      const token = authService.getTokenValue();
      const response = await axios.get(`${API_URL}/scouts/team/${team.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setScouts(response.data);
    } catch (error) {
      console.error('스카우트 목록 로드 오류:', error);
    }
  };

  const loadScoutResults = async () => {
    try {
      const token = authService.getTokenValue();
      const response = await axios.get(`${API_URL}/scouts/results/${team.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setScoutResults(response.data);
    } catch (error) {
      console.error('스카우트 결과 로드 오류:', error);
    }
  };

  const handleCreateScout = async () => {
    if (!newScoutName.trim()) {
      setMessage('스카우트 이름을 입력해주세요.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const token = authService.getTokenValue();
      await axios.post(
        `${API_URL}/scouts/create`,
        {
          teamId: team.id,
          name: newScoutName,
          level: newScoutLevel
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setMessage('스카우트가 생성되었습니다!');
      setNewScoutName('');
      setNewScoutLevel(1);
      loadScouts();
    } catch (error) {
      console.error('스카우트 생성 오류:', error);
      setMessage(error.response?.data?.error || '스카우트 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleRunScout = async (scoutId) => {
    setLoading(true);
    setMessage('');

    try {
      const token = authService.getTokenValue();
      const response = await axios.post(
        `${API_URL}/scouts/${scoutId}/run`,
        { position: selectedPosition || null },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setMessage(`새로운 선수를 발견했습니다! - ${response.data.player.name}`);
      } else {
        setMessage(response.data.message);
      }

      loadScoutResults();
      loadScouts();
    } catch (error) {
      console.error('스카우트 실행 오류:', error);
      setMessage(error.response?.data?.error || '스카우트 실행에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const formatMoney = (amount) => {
    if (amount >= 100000000) {
      return `${(amount / 100000000).toFixed(1)}억`;
    } else if (amount >= 10000) {
      return `${(amount / 10000).toFixed(0)}만`;
    }
    return amount?.toLocaleString() || '0';
  };

  return (
    <div className="scouts-container">
      <h2>스카우트 시스템</h2>
      <p className="description">스카우트를 통해 새로운 선수를 발견하고 영입하세요.</p>

      {message && (
        <div className={`message ${message.includes('성공') || message.includes('발견') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <div className="scouts-content">
        {/* 스카우트 생성 */}
        <div className="create-scout-section">
          <h3>스카우트 생성</h3>
          <div className="form-group">
            <label>스카우트 이름</label>
            <input
              type="text"
              value={newScoutName}
              onChange={(e) => setNewScoutName(e.target.value)}
              placeholder="스카우트 이름 입력"
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label>레벨 (1-5)</label>
            <select
              value={newScoutLevel}
              onChange={(e) => setNewScoutLevel(parseInt(e.target.value))}
              disabled={loading}
            >
              <option value={1}>레벨 1 (발견률 10%, 비용 100만원)</option>
              <option value={2}>레벨 2 (발견률 15%, 비용 200만원)</option>
              <option value={3}>레벨 3 (발견률 20%, 비용 300만원)</option>
              <option value={4}>레벨 4 (발견률 25%, 비용 400만원)</option>
              <option value={5}>레벨 5 (발견률 30%, 비용 500만원)</option>
            </select>
          </div>
          <button
            onClick={handleCreateScout}
            disabled={loading || !newScoutName.trim()}
            className="create-btn"
          >
            {loading ? '생성 중...' : '스카우트 생성'}
          </button>
        </div>

        {/* 스카우트 목록 */}
        <div className="scouts-list-section">
          <h3>보유 스카우트</h3>
          {scouts.length === 0 ? (
            <p className="no-scouts">보유한 스카우트가 없습니다.</p>
          ) : (
            <div className="scouts-list">
              {scouts.map((scout) => (
                <div key={scout.id} className="scout-card">
                  <div className="scout-info">
                    <div className="scout-name">{scout.name}</div>
                    <div className="scout-level">Lv.{scout.level}</div>
                    <div className="scout-stats">
                      발견률: {scout.discovery_rate}% | 비용: {formatMoney(scout.cost_per_scout)}
                    </div>
                  </div>
                  <div className="scout-actions">
                    <select
                      value={selectedPosition}
                      onChange={(e) => setSelectedPosition(e.target.value)}
                      className="position-select"
                    >
                      <option value="">전체 포지션</option>
                      <option value="TOP">TOP</option>
                      <option value="JGL">JGL</option>
                      <option value="MID">MID</option>
                      <option value="ADC">ADC</option>
                      <option value="SPT">SPT</option>
                    </select>
                    <button
                      onClick={() => handleRunScout(scout.id)}
                      disabled={loading}
                      className="run-btn"
                    >
                      스카우트 실행
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 스카우트 결과 */}
      <div className="scout-results-section">
        <h3>발견된 선수</h3>
        {scoutResults.length === 0 ? (
          <p className="no-results">아직 발견된 선수가 없습니다.</p>
        ) : (
          <div className="results-grid">
            {scoutResults
              .filter(r => r.player_id && r.status === 'NEW')
              .map((result) => (
                <div key={result.id} className="result-card">
                  <div className="player-info">
                    <div className="player-name">{result.player_name}</div>
                    <div className="player-position">{result.position}</div>
                    <div className="player-stats">
                      <div>나이: {result.age}세</div>
                      <div>국적: {result.nationality}</div>
                      <div>오버롤: {result.overall}</div>
                    </div>
                    <div className="player-details">
                      <div>멘탈: {result.mental}</div>
                      <div>한타: {result.teamfight}</div>
                      <div>라인전: {result.laning}</div>
                      <div>CS: {result.cs_skill}</div>
                    </div>
                  </div>
                  <div className="result-actions">
                    <button
                      onClick={() => window.location.href = `/players/${result.player_id}`}
                      className="view-btn"
                    >
                      상세 보기
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Scouts;

