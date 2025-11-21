import React, { useState, useEffect } from 'react';
import socketService from '../services/socket';
import './UserCount.css';

function UserCount() {
  const [userCount, setUserCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Socket.IO 연결
    socketService.connect();

    // 유저 수 업데이트 리스너
    const handleUserCountUpdate = (count) => {
      setUserCount(count);
    };

    // 연결 상태 리스너
    const handleConnect = () => {
      setIsConnected(true);
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    socketService.on('userCountUpdated', handleUserCountUpdate);
    socketService.on('socketConnected', handleConnect);
    socketService.on('socketDisconnected', handleDisconnect);

    // 초기 유저 수 설정
    setUserCount(socketService.getUserCount());
    setIsConnected(socketService.getIsConnected());

    // 클린업
    return () => {
      socketService.off('userCountUpdated', handleUserCountUpdate);
      socketService.off('socketConnected', handleConnect);
      socketService.off('socketDisconnected', handleDisconnect);
    };
  }, []);

  return (
    <div className="user-count">
      <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
        <span className="status-dot"></span>
        {isConnected ? '연결됨' : '연결 안됨'}
      </div>
      <div className="user-count-text">
        현재 접속자: <strong>{userCount}</strong>명
      </div>
    </div>
  );
}

export default UserCount;

