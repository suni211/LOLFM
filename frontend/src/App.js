import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import authService from './services/auth';
import Navigation from './components/Navigation';
import Login from './components/Login';
import UserCount from './components/UserCount';
import Dashboard from './components/Dashboard';
import TeamManagement from './components/TeamManagement';
import LeagueStandings from './components/LeagueStandings';
import Rankings from './components/Rankings';
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

  const handleLogout = async () => {
    await authService.logout();
    setUser(null);
  };

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
            <Navigation user={user} onLogout={handleLogout} />
            <UserCount />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<Home user={user} />} />
                <Route path="/team-management" element={<TeamManagementPage user={user} />} />
                <Route path="/league-standings" element={<LeagueStandings />} />
                <Route path="/rankings" element={<Rankings />} />
              </Routes>
            </main>
          </>
        ) : (
          <Login />
        )}
      </div>
    </Router>
  );
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
      const token = authService.getTokenValue();
      const response = await axios.get(`${API_URL}/teams/user/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTeam(response.data);
      setLoading(false);
    } catch (error) {
      console.error('팀 로드 오류:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>팀 정보 로딩 중...</p>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="card" style={{ textAlign: 'center', maxWidth: '600px', margin: '2rem auto' }}>
        <h2 className="card-title" style={{ justifyContent: 'center' }}>
          팀을 생성해주세요
        </h2>
        <p style={{ marginTop: '1rem', color: '#b0b0b0' }}>
          게임을 시작하려면 팀이 필요합니다.
        </p>
        <button className="btn btn-primary" style={{ marginTop: '2rem' }}>
          팀 생성하기
        </button>
      </div>
    );
  }

  return <Dashboard user={user} team={team} />;
}

function TeamManagementPage({ user }) {
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTeam();
  }, []);

  const loadTeam = async () => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const token = authService.getTokenValue();
      const response = await axios.get(`${API_URL}/teams/user/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTeam(response.data);
      setLoading(false);
    } catch (error) {
      console.error('팀 로드 오류:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>팀 정보 로딩 중...</p>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="card" style={{ textAlign: 'center' }}>
        <h2 className="card-title">팀이 없습니다</h2>
        <p>먼저 팀을 생성해주세요.</p>
      </div>
    );
  }

  return <TeamManagement team={team} />;
}

export default App;

