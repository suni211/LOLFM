import React, { useState, useEffect } from 'react';
import axios from 'axios';
import authService from '../services/auth';
import './TransferMarket.css';

function TransferMarket({ team }) {
  const [availablePlayers, setAvailablePlayers] = useState([]);
  const [myPlayers, setMyPlayers] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [offerAmount, setOfferAmount] = useState(0);

  useEffect(() => {
    loadMarketData();
  }, [team]);

  const loadMarketData = async () => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const token = authService.getTokenValue();

      // 이적 시장 선수 목록
      const marketResponse = await axios.get(`${API_URL}/transfer-market`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAvailablePlayers(marketResponse.data);

      // 내 팀 선수 목록
      const playersResponse = await axios.get(`${API_URL}/players/team/${team.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMyPlayers(playersResponse.data);
    } catch (error) {
      console.error('데이터 로드 오류:', error);
    }
  };

  const handleBid = async (playerId) => {
    if (!offerAmount || offerAmount <= 0) {
      window.alert('제안 금액을 입력해주세요');
      return;
    }

    if (offerAmount > team.money) {
      window.alert('보유 자금이 부족합니다');
      return;
    }

    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const token = authService.getTokenValue();

      await axios.post(
        `${API_URL}/transfer-market/bid`,
        { playerId, teamId: team.id, amount: offerAmount },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      window.alert('이적 제안이 완료되었습니다!');
      setSelectedPlayer(null);
      setOfferAmount(0);
      loadMarketData();
    } catch (error) {
      window.alert(error.response?.data?.error || '제안 실패');
    }
  };

  const handleListPlayer = async (playerId) => {
    const price = window.prompt('이적료를 입력하세요 (원):');
    if (!price) return;

    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const token = authService.getTokenValue();

      await axios.post(
        `${API_URL}/transfer-market/list`,
        { playerId, price: parseInt(price) },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      window.alert('선수가 이적 시장에 등록되었습니다!');
      loadMarketData();
    } catch (error) {
      window.alert(error.response?.data?.error || '등록 실패');
    }
  };

  const formatMoney = (amount) => {
    if (amount >= 100000000) return `${(amount / 100000000).toFixed(1)}억`;
    if (amount >= 10000) return `${(amount / 10000).toFixed(0)}만`;
    return amount?.toLocaleString();
  };

  return (
    <div className="transfer-market">
      <div className="page-header">
        <h1 className="page-title">이적 시장</h1>
        <p className="page-subtitle">선수를 영입하거나 매각하세요</p>
      </div>

      <div className="market-layout">
        {/* 이적 시장 */}
        <div className="market-section">
          <h2 className="section-title">이적 시장 선수</h2>
          <div className="players-list">
            {availablePlayers.length > 0 ? (
              availablePlayers.map(player => (
                <div key={player.id} className="player-market-card">
                  <div className="player-basic">
                    <div className="player-position-badge">{player.position}</div>
                    <div className="player-name">{player.name}</div>
                    <div className="player-nationality">{player.nationality}</div>
                  </div>
                  <div className="player-stats-mini">
                    <div className="stat">종합: {player.overall}</div>
                    <div className="stat">포텐: {player.potential}</div>
                  </div>
                  <div className="player-price">
                    💰 {formatMoney(player.transfer_price)}
                  </div>
                  <button
                    className="bid-btn"
                    onClick={() => setSelectedPlayer(player)}
                  >
                    제안하기
                  </button>
                </div>
              ))
            ) : (
              <div className="no-players">현재 이적 시장에 등록된 선수가 없습니다.</div>
            )}
          </div>
        </div>

        {/* 내 선수 */}
        <div className="my-players-section">
          <h2 className="section-title">내 팀 선수</h2>
          <div className="players-list">
            {myPlayers.map(player => (
              <div key={player.id} className="player-my-card">
                <div className="player-basic">
                  <div className="player-position-badge">{player.position}</div>
                  <div className="player-name">{player.name}</div>
                </div>
                <div className="player-stats-mini">
                  <div className="stat">종합: {player.overall}</div>
                  <div className="stat">급여: {formatMoney(player.salary)}</div>
                </div>
                <button
                  className="list-btn"
                  onClick={() => handleListPlayer(player.id)}
                >
                  이적 등록
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 제안 모달 */}
      {selectedPlayer && (
        <div className="modal-overlay" onClick={() => setSelectedPlayer(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>이적 제안</h3>
            <div className="modal-player-info">
              <div className="player-name-large">{selectedPlayer.name}</div>
              <div className="player-details-grid">
                <div>포지션: {selectedPlayer.position}</div>
                <div>종합: {selectedPlayer.overall}</div>
                <div>이적료: {formatMoney(selectedPlayer.transfer_price)}</div>
              </div>
            </div>
            <div className="offer-input-group">
              <label>제안 금액</label>
              <input
                type="number"
                value={offerAmount}
                onChange={(e) => setOfferAmount(parseInt(e.target.value) || 0)}
                placeholder={selectedPlayer.transfer_price}
                className="offer-input"
              />
              <div className="input-hint">
                권장 금액: {formatMoney(selectedPlayer.transfer_price)}
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setSelectedPlayer(null)}>
                취소
              </button>
              <button className="btn btn-primary" onClick={() => handleBid(selectedPlayer.id)}>
                제안하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TransferMarket;

