import React from 'react';
import authService from '../services/auth';
import './Login.css';

function Login() {
  const handleLogin = () => {
    authService.loginWithGoogle();
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-logo">⚡</div>
        <h1 className="login-title">LOLFM</h1>
        <p className="login-subtitle">
          리그 오브 레전드 경영 시뮬레이션<br />
          나만의 팀을 만들어 세계 최강이 되어보세요!
        </p>
        <button onClick={handleLogin} className="login-btn">
          <span className="google-icon">🔐</span>
          Google로 시작하기
        </button>
        
        <div className="login-features">
          <div className="features-title">게임 특징</div>
          <div className="features-list">
            <div className="feature-item">
              <span className="feature-icon">🏆</span>
              <span>4개 지역 리그 시스템</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">👥</span>
              <span>선수 영입 및 육성</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">💰</span>
              <span>재정 관리 및 시설 업그레이드</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🌍</span>
              <span>월드 챔피언십 참가</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
