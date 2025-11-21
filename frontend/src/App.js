import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import authService from './services/auth';
import Login from './components/Login';
import UserCount from './components/UserCount';
import Dashboard from './components/Dashboard';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 사용자 정보 확인
    const checkUser = async () => {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
      setLoading(false);
    };

    checkUser();
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>로딩 중...</p>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        {user ? (
          <>
            <UserCount />
            <header className="App-header">
              <h1>LOLFM - 리그 오브 레전드 경영 시뮬레이션</h1>
              <div className="user-info">
                <img src={user.picture} alt={user.name} className="user-avatar" />
                <span>{user.name}</span>
                <button onClick={handleLogout} className="logout-btn">로그아웃</button>
              </div>
            </header>
            <main>
              <Routes>
                <Route path="/" element={<Home user={user} />} />
              </Routes>
            </main>
          </>
        ) : (
          <Login />
        )}
      </div>
    </Router>
  );

  async function handleLogout() {
    await authService.logout();
    setUser(null);
  }
}

function Home({ user }) {
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTeam();
  }, []);

  const loadTeam = async () => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const response = await axios.get(`${API_URL}/teams/user/${user.id}`, { withCredentials: true });
      setTeam(response.data);
      setLoading(false);
    } catch (error) {
      console.error('팀 로드 오류:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">로딩 중...</div>;
  }

  if (!team) {
    return (
      <div>
        <h2>팀을 생성해주세요</h2>
        <p>게임을 시작하려면 팀이 필요합니다.</p>
      </div>
    );
  }

  return <Dashboard user={user} team={team} />;
}

export default App;

