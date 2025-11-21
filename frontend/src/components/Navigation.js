import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navigation.css';

function Navigation({ user, onLogout }) {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <nav className="navigation">
      <div className="nav-container">
        <div className="nav-brand">
          <Link to="/">
            <span className="brand-icon">⚡</span>
            <span className="brand-text">LOLFM</span>
          </Link>
        </div>

        {user && (
          <>
            <div className="nav-links">
              <Link to="/" className={`nav-link ${isActive('/')}`}>
                <span className="nav-icon">🏠</span>
                <span className="nav-text">홈</span>
              </Link>
              <Link to="/team-management" className={`nav-link ${isActive('/team-management')}`}>
                <span className="nav-icon">👥</span>
                <span className="nav-text">팀 관리</span>
              </Link>
              <Link to="/league-standings" className={`nav-link ${isActive('/league-standings')}`}>
                <span className="nav-icon">🏆</span>
                <span className="nav-text">리그 순위</span>
              </Link>
              <Link to="/rankings" className={`nav-link ${isActive('/rankings')}`}>
                <span className="nav-icon">📊</span>
                <span className="nav-text">랭킹</span>
              </Link>
            </div>

            <div className="nav-user">
              <div className="user-info">
                <img src={user.picture} alt={user.name} className="user-avatar" />
                <span className="user-name">{user.name}</span>
              </div>
              <button onClick={onLogout} className="logout-btn">
                로그아웃
              </button>
            </div>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navigation;

