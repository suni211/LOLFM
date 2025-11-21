import React, { useState, useEffect } from 'react';
import axios from 'axios';
import authService from '../services/auth';
import './TeamCreation.css';

function TeamCreation({ user, onTeamCreated }) {
  const [step, setStep] = useState(1); // 1: 리그 선택, 2: 팀 정보
  const [regions, setRegions] = useState([]);
  const [leagues, setLeagues] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [selectedLeague, setSelectedLeague] = useState(null);
  const [teamData, setTeamData] = useState({
    name: '',
    abbreviation: '',
    logo: null
  });
  const [logoPreview, setLogoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadRegions();
  }, []);

  const loadRegions = async () => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const token = authService.getTokenValue();
      const response = await axios.get(`${API_URL}/regions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRegions(response.data);
    } catch (error) {
      console.error('지역 로드 오류:', error);
    }
  };

  const handleRegionSelect = async (region) => {
    setSelectedRegion(region);
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const token = authService.getTokenValue();
      const response = await axios.get(`${API_URL}/leagues/region/${region.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLeagues(response.data);
    } catch (error) {
      console.error('리그 로드 오류:', error);
    }
  };

  const handleLeagueSelect = (league) => {
    setSelectedLeague(league);
    setStep(2);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTeamData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setTeamData(prev => ({ ...prev, logo: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const token = authService.getTokenValue();

      const formData = new FormData();
      formData.append('name', teamData.name);
      formData.append('abbreviation', teamData.abbreviation);
      formData.append('user_id', user.id);
      formData.append('league_id', selectedLeague.id);
      if (teamData.logo) {
        formData.append('logo', teamData.logo);
      }

      const response = await axios.post(`${API_URL}/teams`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      onTeamCreated(response.data);
    } catch (error) {
      console.error('팀 생성 오류:', error);
      setError(error.response?.data?.error || error.message || '팀 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const getRegionIcon = (code) => {
    const icons = {
      'ASL': '🌏',
      'AMEL': '🌎',
      'EL': '🌍',
      'AL': '🌍'
    };
    return icons[code] || '🌐';
  };

  if (step === 1) {
    return (
      <div className="team-creation">
        <div className="creation-header">
          <h1 className="creation-title">리그 선택</h1>
          <p className="creation-subtitle">팀이 참가할 리그를 선택하세요</p>
        </div>

        {!selectedRegion ? (
          <div className="region-grid">
            {regions.map(region => (
              <div
                key={region.id}
                className="region-card"
                onClick={() => handleRegionSelect(region)}
              >
                <div className="region-icon">{getRegionIcon(region.code)}</div>
                <div className="region-info">
                  <h3 className="region-name">{region.full_name}</h3>
                  <p className="region-code">{region.code}</p>
                </div>
                <div className="region-arrow">→</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="league-selection">
            <button
              className="back-btn"
              onClick={() => {
                setSelectedRegion(null);
                setLeagues([]);
              }}
            >
              ← 지역 다시 선택
            </button>
            <div className="league-grid">
              {leagues.map(league => (
                <div
                  key={league.id}
                  className="league-card"
                  onClick={() => handleLeagueSelect(league)}
                >
                  <div className="league-badge">
                    <span className="league-division">{league.division}부</span>
                  </div>
                  <h3 className="league-name">{league.name}</h3>
                  <div className="league-info">
                    <span className="league-teams">
                      <span className="info-icon">👥</span>
                      {league.current_teams || 0} / {league.max_teams} 팀
                    </span>
                  </div>
                  {league.current_teams >= league.max_teams && (
                    <div className="league-full">정원 초과</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="team-creation">
      <div className="creation-header">
        <h1 className="creation-title">팀 정보 입력</h1>
        <p className="creation-subtitle">
          {selectedRegion?.full_name} - {selectedLeague?.name}
        </p>
      </div>

      <form className="team-form" onSubmit={handleSubmit}>
        {error && <div className="error-message">{error}</div>}
        
        <div className="form-section">
          <label className="form-label">
            <span className="label-icon">🏢</span>
            팀 이름
          </label>
          <input
            type="text"
            name="name"
            value={teamData.name}
            onChange={handleInputChange}
            className="form-input"
            placeholder="예: T1 Esports"
            required
            maxLength={50}
          />
        </div>

        <div className="form-section">
          <label className="form-label">
            <span className="label-icon">🔤</span>
            팀 약자 (3글자)
          </label>
          <input
            type="text"
            name="abbreviation"
            value={teamData.abbreviation}
            onChange={handleInputChange}
            className="form-input"
            placeholder="예: T1"
            required
            maxLength={3}
            pattern="[A-Za-z0-9]{2,3}"
          />
          <p className="input-hint">영문 대소문자와 숫자만 사용 가능 (2-3글자)</p>
        </div>

        <div className="form-section">
          <label className="form-label">
            <span className="label-icon">🖼️</span>
            팀 로고 (선택사항)
          </label>
          <div className="logo-upload">
            <input
              type="file"
              id="logo-input"
              accept="image/*"
              onChange={handleLogoChange}
              className="logo-input"
            />
            <label htmlFor="logo-input" className="logo-label">
              {logoPreview ? (
                <img src={logoPreview} alt="로고 미리보기" className="logo-preview" />
              ) : (
                <div className="logo-placeholder">
                  <span className="placeholder-icon">📷</span>
                  <span className="placeholder-text">로고 업로드</span>
                </div>
              )}
            </label>
          </div>
          <p className="input-hint">권장 크기: 512x512px, 최대 5MB</p>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setStep(1)}
          >
            이전
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? '생성 중...' : '팀 생성하기'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default TeamCreation;

