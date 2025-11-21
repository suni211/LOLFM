import React, { useState, useEffect } from 'react';
import axios from 'axios';
import authService from '../services/auth';
import './Agents.css';

const Agents = ({ team }) => {
  const [agents, setAgents] = useState([]);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    if (team) {
      loadAgents();
      loadPlayers();
    }
  }, [team]);

  const loadAgents = async () => {
    try {
      const token = authService.getTokenValue();
      // 에이전트 목록 조회 (전체 에이전트 또는 팀의 선수들의 에이전트)
      const response = await axios.get(`${API_URL}/players/team/${team.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // 선수들의 에이전트 정보 추출
      const agentMap = new Map();
      response.data.forEach(player => {
        if (player.agent_id && !agentMap.has(player.agent_id)) {
          agentMap.set(player.agent_id, {
            id: player.agent_id,
            name: player.agent_name || '에이전트',
            level: player.agent_level || 1,
            negotiation_skill: player.agent_negotiation_skill || 50,
            commission_rate: player.agent_commission_rate || 5.0
          });
        }
      });
      setAgents(Array.from(agentMap.values()));
    } catch (error) {
      console.error('에이전트 목록 로드 오류:', error);
    }
  };

  const loadPlayers = async () => {
    try {
      const token = authService.getTokenValue();
      const response = await axios.get(`${API_URL}/players/team/${team.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPlayers(response.data || []);
    } catch (error) {
      console.error('선수 목록 로드 오류:', error);
    }
  };

  const handleAssignAgent = async (playerId, agentId) => {
    setLoading(true);
    setMessage('');

    try {
      const token = authService.getTokenValue();
      await axios.post(
        `${API_URL}/players/${playerId}/assign-agent`,
        { agentId },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setMessage('에이전트가 배정되었습니다!');
      loadPlayers();
      loadAgents();
    } catch (error) {
      console.error('에이전트 배정 오류:', error);
      setMessage(error.response?.data?.error || '에이전트 배정에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="agents-container">
      <h2>에이전트 시스템</h2>
      <p className="description">에이전트를 통해 선수 협상 시 급여를 절감할 수 있습니다.</p>

      {message && (
        <div className={`message ${message.includes('성공') || message.includes('배정') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      {/* 에이전트 목록 */}
      <div className="agents-section">
        <h3>보유 에이전트</h3>
        {agents.length === 0 ? (
          <p className="no-agents">보유한 에이전트가 없습니다. 선수에게 에이전트를 배정하면 여기에 표시됩니다.</p>
        ) : (
          <div className="agents-grid">
            {agents.map((agent) => (
              <div key={agent.id} className="agent-card">
                <div className="agent-name">{agent.name}</div>
                <div className="agent-level">Lv.{agent.level}</div>
                <div className="agent-stats">
                  <div>협상 능력: {agent.negotiation_skill}</div>
                  <div>수수료율: {agent.commission_rate}%</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 선수별 에이전트 배정 */}
      <div className="players-section">
        <h3>선수별 에이전트 배정</h3>
        {players.length === 0 ? (
          <p className="no-players">선수가 없습니다.</p>
        ) : (
          <div className="players-list">
            {players.map((player) => (
              <div key={player.id} className="player-card">
                <div className="player-info">
                  <div className="player-name">{player.name}</div>
                  <div className="player-position">{player.position}</div>
                  <div className="player-overall">오버롤: {player.overall}</div>
                </div>
                <div className="agent-assignment">
                  {player.agent_id ? (
                    <div className="assigned-agent">
                      에이전트: {player.agent_name || '에이전트'} (Lv.{player.agent_level || 1})
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        // 랜덤 에이전트 생성 및 배정 (실제로는 에이전트 선택 UI가 필요)
                        const agentId = Math.floor(Math.random() * 100) + 1;
                        handleAssignAgent(player.id, agentId);
                      }}
                      disabled={loading}
                      className="assign-btn"
                    >
                      에이전트 배정
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Agents;

