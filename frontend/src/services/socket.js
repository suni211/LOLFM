import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.userCount = 0;
    this.listeners = new Map();
  }

  connect() {
    if (this.socket && this.isConnected) {
      return;
    }

    this.socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket.IO 연결 성공');
      this.isConnected = true;
      this.emit('socketConnected');
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Socket.IO 연결 해제');
      this.isConnected = false;
      this.emit('socketDisconnected');
    });

    this.socket.on('userCount', (count) => {
      this.userCount = count;
      this.emit('userCountUpdated', count);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket.IO 연결 오류:', error);
      this.emit('socketError', error);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // 이벤트 리스너 추가
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);

    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  // 이벤트 리스너 제거
  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }

    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  // 커스텀 이벤트 발생 (로컬 리스너에게만)
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        callback(data);
      });
    }
  }

  // 서버로 이벤트 전송
  emitToServer(event, data) {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    }
  }

  getSocket() {
    return this.socket;
  }

  getIsConnected() {
    return this.isConnected;
  }

  getUserCount() {
    return this.userCount;
  }
}

// 싱글톤 인스턴스
const socketService = new SocketService();

export default socketService;

