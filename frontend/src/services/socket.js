import { io } from 'socket.io-client';

// Socket.IO 서버 URL (환경 변수 또는 기본값)
// API URL에서 /api를 제거한 기본 URL 사용
const getSocketURL = () => {
  // 프로덕션 환경에서는 https://berrple.com 사용
  if (window.location.hostname === 'berrple.com' || window.location.hostname === 'www.berrple.com') {
    return 'https://berrple.com';
  }
  
  // 환경 변수 확인
  if (process.env.REACT_APP_SOCKET_URL) {
    const url = process.env.REACT_APP_SOCKET_URL;
    // 포트 번호 제거 (Nginx를 통해 연결)
    return url.replace(/:3000|:5000/g, '');
  }
  
  if (process.env.REACT_APP_API_URL) {
    const url = process.env.REACT_APP_API_URL.replace('/api', '');
    // 포트 번호 제거
    return url.replace(/:3000|:5000/g, '');
  }
  
  return 'http://localhost:5000';
};

const SOCKET_URL = getSocketURL();
console.log('🔌 Socket.IO 연결 URL:', SOCKET_URL);

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

    // URL에서 포트 제거 (프로덕션에서는 Nginx를 통해 연결)
    let socketUrl = SOCKET_URL;
    if (socketUrl.includes(':3000') || socketUrl.includes(':5000')) {
      socketUrl = socketUrl.replace(/:3000|:5000/g, '');
    }
    
    // 프로토콜 확인
    if (window.location.protocol === 'https:' && socketUrl.startsWith('http://')) {
      socketUrl = socketUrl.replace('http://', 'https://');
    }
    
    console.log('🔌 Socket.IO 연결 시도:', socketUrl);
    
    this.socket = io(socketUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      path: '/socket.io',
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      autoConnect: true,
      forceNew: false
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

