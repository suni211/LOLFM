import React, { useState, useEffect } from 'react';
import axios from 'axios';
import authService from '../services/auth';
import './Statistics.css';

function Statistics({ team }) {
  const [stats, setStats] = useState({
    team: null,
    players: [],
    matches: [],
    rankings: null
  });

  useEffect(() => {
    loadStatistics();
  }, [team]);

  const loadStatistics = async () => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const token = authService.getTokenValue();

      // 팀 통계
      const teamResponse = await axios.get(`${API_URL}/statistics/team/${team.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // 선수 통계
      const playersResponse = await axios.get(`${API_URL}/statistics/players/${team.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // 경기 기록
      const matchesResponse = await axios.get(`${API_URL}/matches/history/${team.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // 랭킹
      const rankingsResponse = await axios.get(`${API_URL}/rankings`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setStats({
        team: teamResponse.data,
        players: playersResponse.data,
        matches: matchesResponse.data,
        rankings: rankingsResponse.data
      });
    } catch (error) {
      console.error('통계 로드 오류:', error);
    }
  };

  return (
    <div className="statistics">
      <div className="page-header">
        <h1 className="page-title">📊 통계 및 기록</h1>
        <p className="page-subtitle">팀과 선수들의 성적을 확인하세요</p>
      </div>

      {/* 팀 통계 */}
      <div className="stats-section">
        <h2 className="section-title">팀 성적</h2>
        {stats.team && (
          <div className="team-stats-grid">
            <div className="stat-box">
              <div className="stat-label">총 경기</div>
              <div className="stat-value">{stats.team.total_matches}</div>
            </div>
            <div className="stat-box win">
              <div className="stat-label">승리</div>
              <div className="stat-value">{stats.team.wins}</div>
            </div>
            <div className="stat-box draw">
              <div className="stat-label">무승부</div>
              <div className="stat-value">{stats.team.draws}</div>
            </div>
            <div className="stat-box loss">
              <div className="stat-label">패배</div>
              <div className="stat-value">{stats.team.losses}</div>
            </div>
            <div className="stat-box">
              <div className="stat-label">승률</div>
              <div className="stat-value">{stats.team.win_rate}%</div>
            </div>
          </div>
        )}
      </div>

      {/* 선수 통계 */}
      <div className="stats-section">
        <h2 className="section-title">선수 통계</h2>
        <div className="table-container">
          <table className="stats-table">
            <thead>
              <tr>
                <th>이름</th>
                <th>포지션</th>
                <th>경기</th>
                <th>승률</th>
                <th>평점</th>
                <th>KDA</th>
              </tr>
            </thead>
            <tbody>
              {stats.players.map(player => (
                <tr key={player.id}>
                  <td className="player-name-cell">{player.name}</td>
                  <td>
                    <span className="position-badge">{player.position}</span>
                  </td>
                  <td>{player.matches_played}</td>
                  <td>{player.win_rate}%</td>
                  <td className="rating">{player.average_rating}</td>
                  <td>{player.kda}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 최근 경기 */}
      <div className="stats-section">
        <h2 className="section-title">최근 경기</h2>
        <div className="matches-list">
          {stats.matches.slice(0, 10).map(match => (
            <div key={match.id} className={`match-record ${match.result}`}>
              <div className="match-result-badge">{match.result === 'win' ? '승' : match.result === 'loss' ? '패' : '무'}</div>
              <div className="match-info">
                <div className="match-opponent">{match.opponent_name}</div>
                <div className="match-date">{new Date(match.match_date).toLocaleDateString()}</div>
              </div>
              <div className="match-score">{match.score}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 랭킹 */}
      {stats.rankings && (
        <div className="stats-section">
          <h2 className="section-title">리그 랭킹</h2>
          <div className="rankings-grid">
            <div className="ranking-card">
              <div className="ranking-label">리그 순위</div>
              <div className="ranking-value">{stats.rankings.league_rank}위</div>
            </div>
            <div className="ranking-card">
              <div className="ranking-label">자금 순위</div>
              <div className="ranking-value">{stats.rankings.money_rank}위</div>
            </div>
            <div className="ranking-card">
              <div className="ranking-label">팬 순위</div>
              <div className="ranking-value">{stats.rankings.fans_rank}위</div>
            </div>
            <div className="ranking-card">
              <div className="ranking-label">명성 순위</div>
              <div className="ranking-value">{stats.rankings.reputation_rank}위</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Statistics;

