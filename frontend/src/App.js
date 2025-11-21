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
import PlayerSelection from './components/PlayerSelection';
import Facilities from './components/Facilities';
import Training from './components/Training';
import Sponsors from './components/Sponsors';
import Finances from './components/Finances';
import TransferMarket from './components/TransferMarket';
import Statistics from './components/Statistics';
import PlayerDetail from './components/PlayerDetail';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [team, setTeam] = useState(null);
  const [needsPlayerSelection, setNeedsPlayerSelection] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 사용자 정보 확인
    const checkUser = async () => {
      console.log('사용자 확인 중...');
      const currentUser = await authService.getCurrentUser();
      console.log('사용자 정보:', currentUser);
      setUser(currentUser);
      
      if (currentUser) {
        await loadTeam(currentUser);
      } else {
        console.log('로그인 필요');
      }
      
      setLoading(false);
    };

    checkUser();
  }, []);

  const loadTeam = async (currentUser) => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const token = authService.getTokenValue();
      console.log('팀 로드 시도:', currentUser.id);
      const response = await axios.get(`${API_URL}/teams/user/${currentUser.id}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true
      });
      console.log('팀 정보:', response.data);
      setTeam(response.data);
    } catch (error) {
      console.log('팀 없음 - 팀 생성 필요');
      if (error.response?.status === 404) {
        // 팀이 없는 것은 정상 - 팀 생성 화면으로
        setTeam(null);
      } else {
        console.error('팀 로드 오류:', error);
        setTeam(null);
      }
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    setUser(null);
    setTeam(null);
  };

  const handleTeamCreated = (newTeam) => {
    setTeam(newTeam);
    setNeedsPlayerSelection(true);
  };

  const handlePlayerSelectionComplete = () => {
    setNeedsPlayerSelection(false);
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
              ) : needsPlayerSelection ? (
                <PlayerSelection team={team} onComplete={handlePlayerSelectionComplete} />
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
                  <Route path="/league-standings" element={<LeagueStandings leagueId={team.league_id} />} />
                  <Route path="/rankings" element={<Rankings />} />
                  <Route path="/players/:playerId" element={<PlayerDetail />} />
                </Routes>
              )}
            </main>
          </>
        ) : (
          <>
            <UserCount />
            <Login />
          </>
        )}
      </div>
    </Router>
  );
}

function TeamManagementPage({ team }) {
  return <TeamManagement team={team} />;
}

export default App;

