import React, { useState, useEffect } from 'react';
import axios from 'axios';
import authService from '../services/auth';
import './Facilities.css';

function Facilities({ team }) {
  const [facilities, setFacilities] = useState({
    stadium: null,
    dormitory: null,
    training: null,
    medical: null,
    media: null
  });
  const [upgrading, setUpgrading] = useState(null);

  useEffect(() => {
    loadFacilities();
  }, [team]);

  const loadFacilities = async () => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const token = authService.getTokenValue();

      const response = await axios.get(`${API_URL}/facilities/${team.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFacilities(response.data);
    } catch (error) {
      console.error('시설 로드 오류:', error);
    }
  };

  const handleUpgrade = async (facilityType) => {
    setUpgrading(facilityType);
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const token = authService.getTokenValue();

      await axios.post(
        `${API_URL}/facilities/${team.id}/upgrade`,
        { facilityType },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert(`${getFacilityName(facilityType)} 업그레이드가 시작되었습니다!`);
      loadFacilities();
    } catch (error) {
      alert(error.response?.data?.error || '업그레이드 실패');
    } finally {
      setUpgrading(null);
    }
  };

  const getFacilityName = (type) => {
    const names = {
      stadium: '경기장',
      dormitory: '숙소',
      training: '훈련장',
      medical: '의료실',
      media: '미디어실'
    };
    return names[type];
  };

  const getFacilityIcon = (type) => {
    const icons = {
      stadium: '🏟️',
      dormitory: '🏠',
      training: '💪',
      medical: '🏥',
      media: '📺'
    };
    return icons[type];
  };

  const formatMoney = (amount) => {
    if (amount >= 100000000) return `${(amount / 100000000).toFixed(1)}억`;
    if (amount >= 10000) return `${(amount / 10000).toFixed(0)}만`;
    return amount?.toLocaleString();
  };

  const renderFacility = (type, data) => {
    if (!data) return null;

    const canUpgrade = team.money >= data.upgrade_cost && data.level < data.max_level;

    return (
      <div className="facility-card">
        <div className="facility-header">
          <span className="facility-icon">{getFacilityIcon(type)}</span>
          <div className="facility-info">
            <h3 className="facility-name">{getFacilityName(type)}</h3>
            <div className="facility-level">Lv.{data.level} / {data.max_level}</div>
          </div>
        </div>

        <div className="facility-stats">
          <div className="stat-row">
            <span>효과</span>
            <span className="value">{data.effect}</span>
          </div>
          <div className="stat-row">
            <span>월 유지비</span>
            <span className="value expense">-{formatMoney(data.maintenance_cost)}</span>
          </div>
          {data.level < data.max_level && (
            <>
              <div className="stat-row">
                <span>업그레이드 비용</span>
                <span className="value">{formatMoney(data.upgrade_cost)}</span>
              </div>
              <div className="stat-row">
                <span>소요 시간</span>
                <span className="value">{data.upgrade_time}</span>
              </div>
            </>
          )}
        </div>

        {data.level < data.max_level ? (
          <button
            className={`upgrade-btn ${!canUpgrade ? 'disabled' : ''}`}
            onClick={() => handleUpgrade(type)}
            disabled={!canUpgrade || upgrading === type}
          >
            {upgrading === type ? '업그레이드 중...' : '업그레이드'}
          </button>
        ) : (
          <div className="max-level">최대 레벨</div>
        )}
      </div>
    );
  };

  return (
    <div className="facilities">
      <div className="page-header">
        <h1 className="page-title">시설 관리</h1>
        <p className="page-subtitle">팀의 시설을 업그레이드하여 경쟁력을 높이세요</p>
      </div>

      <div className="facilities-grid">
        {renderFacility('stadium', facilities.stadium)}
        {renderFacility('dormitory', facilities.dormitory)}
        {renderFacility('training', facilities.training)}
        {renderFacility('medical', facilities.medical)}
        {renderFacility('media', facilities.media)}
      </div>
    </div>
  );
}

export default Facilities;

