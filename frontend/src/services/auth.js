import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class AuthService {
  constructor() {
    this.user = null;
  }

  // 구글 로그인
  loginWithGoogle() {
    window.location.href = `${API_URL}/auth/google`;
  }

  // 로그아웃
  async logout() {
    try {
      await axios.get(`${API_URL}/auth/logout`, { withCredentials: true });
      this.user = null;
      return true;
    } catch (error) {
      console.error('로그아웃 실패:', error);
      return false;
    }
  }

  // 현재 사용자 정보 가져오기
  async getCurrentUser() {
    try {
      const response = await axios.get(`${API_URL}/auth/me`, { withCredentials: true });
      this.user = response.data;
      return this.user;
    } catch (error) {
      this.user = null;
      return null;
    }
  }

  // 인증 여부 확인
  isAuthenticated() {
    return this.user !== null;
  }

  // 사용자 정보 가져오기
  getUser() {
    return this.user;
  }
}

// 싱글톤 인스턴스
const authService = new AuthService();

export default authService;

