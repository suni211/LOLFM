import { io } from 'socket.io-client';

// Socket.IO 서버 URL - 런타임에 결정 (빌드 시점이 아닌 실행 시점)
const getSocketURL = () => {
  if (typeof window === 'undefined') {
    return 'http://localhost:5000';
  }
  
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  
  // 프로덕션 환경 강제 설정 (가장 우선)
  if (hostname === 'berrple.com' || hostname === 'www.berrple.com') {
    return 'https://berrple.com';
  }
  
  // 로컬 환경
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:5000';
  }
  
  // 환경 변수 확인 (런타임 - 빌드 시점 값이 아닌 실제 값)
  // React는 빌드 시점에 환경 변수를 번들에 포함시키므로
  // 런타임에는 window.location을 기준으로 결정
  const baseUrl = `${protocol}//${hostname}`;
  return baseUrl;
};

const SOCKET_URL = getSocketURL();
console.log('🔌 Socket.IO 연결 URL (초기):', SOCKET_URL);

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

    // 런타임에 URL 재계산 (항상 최신 값 사용)
    let socketUrl = getSocketURL();
    
    // 포트 번호 강제 제거 (모든 경우)
    socketUrl = socketUrl.replace(/:3000|:5000/g, '');
    
    // 프로토콜 확인 및 수정
    if (typeof window !== 'undefined') {
      const protocol = window.location.protocol;
      if (protocol === 'https:' && socketUrl.startsWith('http://')) {
        socketUrl = socketUrl.replace('http://', 'https://');
      }
      if (protocol === 'http:' && socketUrl.startsWith('https://')) {
        socketUrl = socketUrl.replace('https://', 'http://');
      }
    }
    
    console.log('🔌 Socket.IO 연결 시도:', socketUrl);
    console.log('🔌 현재 호스트:', typeof window !== 'undefined' ? window.location.hostname : 'N/A');
    console.log('🔌 현재 프로토콜:', typeof window !== 'undefined' ? window.location.protocol : 'N/A');
    
    // 기존 연결이 있으면 먼저 끊기
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
    
    // socket.io-client 옵션
    const socketOptions = {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      path: '/socket.io',
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      autoConnect: true,
      forceNew: true,
      upgrade: true,
      rememberUpgrade: false
    };
    
    console.log('🔌 Socket.IO 옵션:', socketOptions);
    
    this.socket = io(socketUrl, socketOptions);

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

