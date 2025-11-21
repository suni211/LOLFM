import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Rankings.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function Rankings() {
  const [rankings, setRankings] = useState({
    money: [],
    fans: [],
    awareness: [],
    worldChampionships: []
  });
  const [activeTab, setActiveTab] = useState('money');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRankings();
  }, []);

  const loadRankings = async () => {
    try {
      const types = ['money', 'fans', 'awareness', 'worldChampionships'];
      const newRankings = {};

      for (const type of types) {
        const response = await axios.get(`${API_URL}/rankings/${type.toUpperCase()}?limit=10`, { withCredentials: true });
        newRankings[type] = response.data;
      }

      setRankings(newRankings);
      setLoading(false);
    } catch (error) {
      console.error('랭킹 로드 오류:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">로딩 중...</div>;
  }

  const getRankingTitle = (type) => {
    const titles = {
      money: '자금 랭킹',
      fans: '팬 수 랭킹',
      awareness: '인지도 랭킹',
      worldChampionships: '월즈 우승 랭킹'
    };
    return titles[type] || type;
  };

  const formatValue = (type, value) => {
    if (type === 'money') {
      return `${value.toLocaleString()}원`;
    } else if (type === 'fans' || type === 'awareness') {
      return value.toLocaleString();
    } else {
      return `${value}회`;
    }
  };

  return (
    <div className="rankings">
      <div className="page-header">
        <h1 className="page-title">🏆 랭킹</h1>
        <p className="page-subtitle">전체 팀 순위를 확인하세요</p>
      </div>
      <div className="ranking-tabs">
        <button 
          className={activeTab === 'money' ? 'active' : ''}
          onClick={() => setActiveTab('money')}
        >
          자금
        </button>
        <button 
          className={activeTab === 'fans' ? 'active' : ''}
          onClick={() => setActiveTab('fans')}
        >
          팬 수
        </button>
        <button 
          className={activeTab === 'awareness' ? 'active' : ''}
          onClick={() => setActiveTab('awareness')}
        >
          인지도
        </button>
        <button 
          className={activeTab === 'worldChampionships' ? 'active' : ''}
          onClick={() => setActiveTab('worldChampionships')}
        >
          월즈 우승
        </button>
      </div>
      <div className="ranking-list">
        <h3>{getRankingTitle(activeTab)}</h3>
        <table className="ranking-table">
          <thead>
            <tr>
              <th>순위</th>
              <th>팀명</th>
              <th>값</th>
            </tr>
          </thead>
          <tbody>
            {rankings[activeTab].map((ranking, index) => (
              <tr key={ranking.id} className={index < 3 ? 'top-three' : ''}>
                <td>
                  {index === 0 && '🥇'}
                  {index === 1 && '🥈'}
                  {index === 2 && '🥉'}
                  {index >= 3 && ranking.rank}
                </td>
                <td>{ranking.team_name}</td>
                <td><strong>{formatValue(activeTab, ranking.value)}</strong></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Rankings;

