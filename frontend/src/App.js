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
import TeamCreation from './components/TeamCreation';
import Facilities from './components/Facilities';
import Training from './components/Training';
import Sponsors from './components/Sponsors';
import Finances from './components/Finances';
import TransferMarket from './components/TransferMarket';
import Statistics from './components/Statistics';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 사용자 정보 확인
    const checkUser = async () => {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
      
      if (currentUser) {
        await loadTeam(currentUser);
      }
      
      setLoading(false);
    };

    checkUser();
  }, []);

  const loadTeam = async (currentUser) => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const token = authService.getTokenValue();
      const response = await axios.get(`${API_URL}/teams/user/${currentUser.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTeam(response.data);
    } catch (error) {
      console.error('팀 로드 오류:', error);
      setTeam(null);
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    setUser(null);
    setTeam(null);
  };

  const handleTeamCreated = (newTeam) => {
    setTeam(newTeam);
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
            {team && <Navigation user={user} onLogout={handleLogout} team={team} />}
            <UserCount />
            <main className="main-content">
              {!team ? (
                <TeamCreation user={user} onTeamCreated={handleTeamCreated} />
              ) : (
                <Routes>
                  <Route path="/" element={<Dashboard user={user} team={team} />} />
                  <Route path="/team-management" element={<TeamManagementPage team={team} />} />
                  <Route path="/facilities" element={<Facilities team={team} />} />
                  <Route path="/training" element={<Training team={team} />} />
                  <Route path="/sponsors" element={<Sponsors team={team} />} />
                  <Route path="/finances" element={<Finances team={team} />} />
                  <Route path="/transfer-market" element={<TransferMarket team={team} />} />
                  <Route path="/statistics" element={<Statistics team={team} />} />
                  <Route path="/league-standings" element={<LeagueStandings />} />
                  <Route path="/rankings" element={<Rankings />} />
                </Routes>
              )}
            </main>
          </>
        ) : (
          <Login />
        )}
      </div>
    </Router>
  );
}

function TeamManagementPage({ team }) {
  return <TeamManagement team={team} />;
}

export default App;

