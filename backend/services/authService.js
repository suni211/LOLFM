const { pool } = require('../server');
const jwt = require('jsonwebtoken');
const axios = require('axios');

/**
 * OAuth 2.0 인증 서비스
 */
class AuthService {
  // Google OAuth 2.0 인증 URL 생성
  static getGoogleAuthUrl() {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback';
    const scope = 'openid profile email';
    const responseType = 'code';
    const state = Math.random().toString(36).substring(7); // CSRF 방지용

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=${responseType}&` +
      `scope=${encodeURIComponent(scope)}&` +
      `state=${state}`;

    return { authUrl, state };
  }

  // Google OAuth 2.0 토큰 교환
  static async exchangeCodeForToken(code) {
    try {
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
      const redirectUri = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback';

      const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
        code: code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      return tokenResponse.data;
    } catch (error) {
      console.error('토큰 교환 오류:', error.response?.data || error.message);
      throw error;
    }
  }

  // Google 사용자 정보 가져오기
  static async getGoogleUserInfo(accessToken) {
    try {
      const userInfoResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });

      return userInfoResponse.data;
    } catch (error) {
      console.error('사용자 정보 가져오기 오류:', error.response?.data || error.message);
      throw error;
    }
  }

  // 사용자 생성 또는 조회
  static async findOrCreateUser(googleUserInfo) {
    const conn = await pool.getConnection();
    try {
      let user = await conn.query(
        'SELECT * FROM users WHERE google_id = ?',
        [googleUserInfo.id]
      );

      if (user.length === 0) {
        // 새 사용자 생성
        await conn.query(
          `INSERT INTO users (google_id, email, name, picture, created_at) 
           VALUES (?, ?, ?, ?, NOW())`,
          [
            googleUserInfo.id,
            googleUserInfo.email,
            googleUserInfo.name,
            googleUserInfo.picture
          ]
        );
        user = await conn.query(
          'SELECT * FROM users WHERE google_id = ?',
          [googleUserInfo.id]
        );
      } else {
        // 사용자 정보 업데이트
        await conn.query(
          `UPDATE users SET email = ?, name = ?, picture = ?, updated_at = NOW() 
           WHERE google_id = ?`,
          [
            googleUserInfo.email,
            googleUserInfo.name,
            googleUserInfo.picture,
            googleUserInfo.id
          ]
        );
        user = await conn.query(
          'SELECT * FROM users WHERE google_id = ?',
          [googleUserInfo.id]
        );
      }

      conn.release();
      return user[0];
    } catch (error) {
      conn.release();
      throw error;
    }
  }

  // JWT 토큰 생성
  static generateToken(user) {
    const payload = {
      id: user.id,
      email: user.email,
      name: user.name
    };

    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '7d' // 7일
    });
  }

  // JWT 토큰 검증
  static verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return null;
    }
  }
}

module.exports = AuthService;

