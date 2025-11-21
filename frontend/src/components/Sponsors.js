import React, { useState, useEffect } from 'react';
import axios from 'axios';
import authService from '../services/auth';
import './Sponsors.css';

function Sponsors({ team }) {
  const [availableSponsors, setAvailableSponsors] = useState([]);
  const [currentSponsor, setCurrentSponsor] = useState(null);

  useEffect(() => {
    loadSponsors();
  }, [team]);

  const loadSponsors = async () => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const token = authService.getTokenValue();

      // 현재 스폰서
      const currentResponse = await axios.get(`${API_URL}/sponsors/current/${team.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCurrentSponsor(currentResponse.data);

      // 이용 가능한 스폰서
      const availableResponse = await axios.get(`${API_URL}/sponsors/available/${team.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAvailableSponsors(availableResponse.data);
    } catch (error) {
      console.error('스폰서 로드 오류:', error);
    }
  };

  const handleContract = async (sponsorId) => {
    if (!confirm('이 스폰서와 계약하시겠습니까?')) return;

    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const token = authService.getTokenValue();

      await axios.post(
        `${API_URL}/sponsors/contract`,
        { teamId: team.id, sponsorId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert('스폰서 계약이 완료되었습니다!');
      loadSponsors();
    } catch (error) {
      alert(error.response?.data?.error || '계약 실패');
    }
  };

  const handleTerminate = async () => {
    if (!confirm('현재 스폰서와의 계약을 해지하시겠습니까?')) return;

    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const token = authService.getTokenValue();

      await axios.post(
        `${API_URL}/sponsors/terminate`,
        { teamId: team.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert('스폰서 계약이 해지되었습니다.');
      loadSponsors();
    } catch (error) {
      alert(error.response?.data?.error || '해지 실패');
    }
  };

  const getStarRating = (rating) => {
    return '⭐'.repeat(rating);
  };

  const formatMoney = (amount) => {
    if (amount >= 100000000) return `${(amount / 100000000).toFixed(1)}억`;
    if (amount >= 10000) return `${(amount / 10000).toFixed(0)}만`;
    return amount?.toLocaleString();
  };

  return (
    <div className="sponsors">
      <div className="page-header">
        <h1 className="page-title">스폰서 관리</h1>
        <p className="page-subtitle">스폰서를 통해 안정적인 수입을 확보하세요</p>
      </div>

      {/* 현재 스폰서 */}
      {currentSponsor && (
        <div className="current-sponsor-section">
          <h2 className="section-title">현재 스폰서</h2>
          <div className="sponsor-card current">
            <div className="sponsor-header">
              <div className="sponsor-name">{currentSponsor.name}</div>
              <div className="sponsor-rating">{getStarRating(currentSponsor.rating)}</div>
            </div>
            <div className="sponsor-benefits">
              <div className="benefit-item">
                <span className="benefit-icon">💰</span>
                <div className="benefit-info">
                  <div className="benefit-label">월 후원금</div>
                  <div className="benefit-value">{formatMoney(currentSponsor.monthly_support)}</div>
                </div>
              </div>
              <div className="benefit-item">
                <span className="benefit-icon">🏆</span>
                <div className="benefit-info">
                  <div className="benefit-label">승리 보너스</div>
                  <div className="benefit-value">{formatMoney(currentSponsor.win_bonus)}</div>
                </div>
              </div>
            </div>
            <button className="terminate-btn" onClick={handleTerminate}>
              계약 해지
            </button>
          </div>
        </div>
      )}

      {/* 이용 가능한 스폰서 */}
      <div className="available-sponsors-section">
        <h2 className="section-title">이용 가능한 스폰서</h2>
        <div className="sponsors-grid">
          {availableSponsors.length > 0 ? (
            availableSponsors.map(sponsor => (
              <div key={sponsor.id} className="sponsor-card">
                <div className="sponsor-header">
                  <div className="sponsor-name">{sponsor.name}</div>
                  <div className="sponsor-rating">{getStarRating(sponsor.rating)}</div>
                </div>
                <div className="sponsor-requirements">
                  <div className="req-item">
                    <span>필요 인지도:</span>
                    <span className={team.awareness >= sponsor.min_awareness ? 'met' : 'unmet'}>
                      {sponsor.min_awareness}
                    </span>
                  </div>
                  <div className="req-item">
                    <span>필요 명성:</span>
                    <span className={team.reputation >= sponsor.min_reputation ? 'met' : 'unmet'}>
                      {sponsor.min_reputation}
                    </span>
                  </div>
                  <div className="req-item">
                    <span>필요 팬 수:</span>
                    <span className={team.fans >= sponsor.min_fans ? 'met' : 'unmet'}>
                      {formatMoney(sponsor.min_fans)}
                    </span>
                  </div>
                </div>
                <div className="sponsor-benefits">
                  <div className="benefit-item">
                    <span className="benefit-icon">💰</span>
                    <div className="benefit-info">
                      <div className="benefit-label">월 후원금</div>
                      <div className="benefit-value">{formatMoney(sponsor.monthly_support)}</div>
                    </div>
                  </div>
                  <div className="benefit-item">
                    <span className="benefit-icon">🏆</span>
                    <div className="benefit-info">
                      <div className="benefit-label">승리 보너스</div>
                      <div className="benefit-value">{formatMoney(sponsor.win_bonus)}</div>
                    </div>
                  </div>
                </div>
                <button
                  className={`contract-btn ${
                    team.awareness < sponsor.min_awareness ||
                    team.reputation < sponsor.min_reputation ||
                    team.fans < sponsor.min_fans
                      ? 'disabled'
                      : ''
                  }`}
                  onClick={() => handleContract(sponsor.id)}
                  disabled={
                    team.awareness < sponsor.min_awareness ||
                    team.reputation < sponsor.min_reputation ||
                    team.fans < sponsor.min_fans ||
                    currentSponsor
                  }
                >
                  {currentSponsor ? '이미 계약 중' : '계약하기'}
                </button>
              </div>
            ))
          ) : (
            <div className="no-sponsors">현재 이용 가능한 스폰서가 없습니다.</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Sponsors;

