import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const TOKEN_KEY = 'lolfm_token';

class AuthService {
  constructor() {
    this.user = null;
    this.token = this.getToken();
    
    // URL에서 토큰 확인 (OAuth 콜백 후)
    this.checkTokenFromUrl();
  }

  // URL에서 토큰 확인
  checkTokenFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const error = urlParams.get('error');

    if (token) {
      this.setToken(token);
      // URL에서 토큰 제거
      window.history.replaceState({}, document.title, window.location.pathname);
      // 사용자 정보 가져오기
      this.getCurrentUser();
    }

    if (error) {
      console.error('인증 오류:', error);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }

  // 토큰 저장
  setToken(token) {
    this.token = token;
    localStorage.setItem(TOKEN_KEY, token);
    // axios 기본 헤더에 토큰 설정
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  // 토큰 가져오기
  getToken() {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    return token;
  }

  // 토큰 삭제
  removeToken() {
    this.token = null;
    localStorage.removeItem(TOKEN_KEY);
    delete axios.defaults.headers.common['Authorization'];
  }

  // Google OAuth 2.0 로그인
  async loginWithGoogle() {
    try {
      // 인증 URL 가져오기
      const response = await axios.get(`${API_URL}/auth/google`);
      if (response.data.authUrl) {
        window.location.href = response.data.authUrl;
      }
    } catch (error) {
      console.error('로그인 URL 가져오기 실패:', error);
    }
  }

  // 로그아웃
  async logout() {
    try {
      await axios.post(`${API_URL}/auth/logout`, {}, {
        headers: { Authorization: `Bearer ${this.token}` }
      });
      this.user = null;
      this.removeToken();
      return true;
    } catch (error) {
      console.error('로그아웃 실패:', error);
      // 토큰은 삭제
      this.user = null;
      this.removeToken();
      return false;
    }
  }

  // 현재 사용자 정보 가져오기
  async getCurrentUser() {
    if (!this.token) {
      this.user = null;
      return null;
    }

    try {
      const response = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${this.token}` }
      });
      this.user = response.data;
      return this.user;
    } catch (error) {
      // 토큰이 유효하지 않으면 삭제
      if (error.response?.status === 401 || error.response?.status === 403) {
        this.removeToken();
      }
      this.user = null;
      return null;
    }
  }

  // 인증 여부 확인
  isAuthenticated() {
    return this.token !== null && this.user !== null;
  }

  // 사용자 정보 가져오기
  getUser() {
    return this.user;
  }

  // 토큰 가져오기
  getTokenValue() {
    return this.token;
  }
}

// 싱글톤 인스턴스
const authService = new AuthService();

export default authService;

