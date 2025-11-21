import React, { useState, useEffect } from 'react';
import axios from 'axios';
import LogoUpload from './LogoUpload';
import './Dashboard.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function Dashboard({ user, team }) {
  const [teamData, setTeamData] = useState(null);
  const [financial, setFinancial] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (team) {
      loadDashboardData();
    }
  }, [team]);

  const loadDashboardData = async () => {
    try {
      // 팀 정보
      const teamRes = await axios.get(`${API_URL}/teams/${team.id}`, { withCredentials: true });
      setTeamData(teamRes.data);

      // 재정 정보
      const financialRes = await axios.get(`${API_URL}/financial/maintenance/${team.id}`, { withCredentials: true });
      setFinancial(financialRes.data);

      // 알림
      const notifRes = await axios.get(`${API_URL}/notifications`, { withCredentials: true });
      setNotifications(notifRes.data.slice(0, 5));

      setLoading(false);
    } catch (error) {
      console.error('대시보드 데이터 로드 오류:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">로딩 중...</div>;
  }

  const handleLogoUpdate = (logoPath) => {
    setTeamData(prev => ({ ...prev, logo_path: logoPath }));
  };

  const logoUrl = teamData?.logo_path 
    ? `${API_URL.replace('/api', '')}${teamData.logo_path}`
    : null;

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="team-header">
          {logoUrl && (
            <img src={logoUrl} alt="팀 로고" className="team-logo" />
          )}
          <div>
            <h2>{teamData?.name || '팀 이름'}</h2>
            <p className="team-subtitle">대시보드</p>
          </div>
        </div>
      </div>
      
      <div className="dashboard-grid">
        {/* 로고 업로드 */}
        <div className="dashboard-card logo-upload-card">
          <LogoUpload team={teamData || team} onLogoUpdate={handleLogoUpdate} />
        </div>

        {/* 재정 현황 */}
        <div className="dashboard-card financial">
          <h3>재정 현황</h3>
          <div className="money-display">
            <span className="amount">{teamData?.money?.toLocaleString() || 0}원</span>
          </div>
          <div className="financial-details">
            <div className="detail-item">
              <span>월 유지비:</span>
              <span className="expense">-{financial?.total?.toLocaleString() || 0}원</span>
            </div>
            <div className="detail-item">
              <span>경기장:</span>
              <span>-{financial?.stadium?.toLocaleString() || 0}원</span>
            </div>
            <div className="detail-item">
              <span>숙소:</span>
              <span>-{financial?.dormitory?.toLocaleString() || 0}원</span>
            </div>
            <div className="detail-item">
              <span>주급:</span>
              <span>-{financial?.salary?.toLocaleString() || 0}원</span>
            </div>
          </div>
        </div>

        {/* 팀 정보 */}
        <div className="dashboard-card team-info">
          <h3>팀 정보</h3>
          <div className="team-stats">
            <div className="stat-item">
              <span>팬 수:</span>
              <strong>{teamData?.fans?.toLocaleString() || 0}</strong>
            </div>
            <div className="stat-item">
              <span>인지도:</span>
              <strong>{teamData?.awareness || 0}</strong>
            </div>
            <div className="stat-item">
              <span>명성:</span>
              <strong>{teamData?.reputation || 0}</strong>
            </div>
          </div>
        </div>

        {/* 알림 */}
        <div className="dashboard-card notifications">
          <h3>알림</h3>
          <div className="notification-list">
            {notifications.length > 0 ? (
              notifications.map(notif => (
                <div key={notif.id} className={`notification-item ${notif.priority?.toLowerCase()}`}>
                  <div className="notification-title">{notif.title}</div>
                  <div className="notification-message">{notif.message}</div>
                </div>
              ))
            ) : (
              <div className="no-notifications">알림이 없습니다.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;

