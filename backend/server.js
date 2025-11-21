const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
const AuthService = require('./services/authService');
const pool = require('./database/pool');

dotenv.config();

// BigInt 직렬화 처리
BigInt.prototype.toJSON = function() {
  return this.toString();
};

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
  }
});

const PORT = process.env.PORT || 5000;

// 미들웨어
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 쿠키 파서
const cookieParser = require('cookie-parser');
app.use(cookieParser());

// IP 추출 미들웨어
app.use((req, res, next) => {
  const forwarded = req.headers['x-forwarded-for'];
  req.ip = forwarded ? forwarded.split(',')[0] : req.connection.remoteAddress || req.socket.remoteAddress;
  next();
});

// JWT 인증 미들웨어
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: '인증 토큰이 필요합니다.' });
  }

  const decoded = AuthService.verifyToken(token);
  if (!decoded) {
    return res.status(403).json({ error: '유효하지 않은 토큰입니다.' });
  }

  // 사용자 정보를 req.user에 추가
  const conn = await pool.getConnection();
  try {
    const users = await conn.query('SELECT * FROM users WHERE id = ?', [decoded.id]);
    if (users.length === 0) {
      return res.status(403).json({ error: '사용자를 찾을 수 없습니다.' });
    }
    req.user = users[0];
    next();
  } catch (error) {
    return res.status(500).json({ error: '인증 처리 중 오류가 발생했습니다.' });
  } finally {
    conn.release();
  }
};


// 정적 파일 서빙 (업로드된 파일)
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// 라우트 임포트
const financialRoutes = require('./routes/financial');
const playerRoutes = require('./routes/players');
const matchRoutes = require('./routes/matches');
const sponsorRoutes = require('./routes/sponsors');
const eventRoutes = require('./routes/events');
const rankingRoutes = require('./routes/rankings');
const notificationRoutes = require('./routes/notifications');
const transferMarketRoutes = require('./routes/transferMarket');
const teamRoutes = require('./routes/teams');
const regionsRoutes = require('./routes/regions');
const leaguesRoutes = require('./routes/leagues');
const facilitiesRoutes = require('./routes/facilities');
const gameTimeRoutes = require('./routes/gameTime');
const trainingRoutes = require('./routes/training');
const statisticsRoutes = require('./routes/statistics');

app.use('/api/financial', financialRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/players', playerRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/sponsors', sponsorRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/rankings', rankingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/transfer-market', transferMarketRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/regions', regionsRoutes);
app.use('/api/leagues', leaguesRoutes);
app.use('/api/facilities', facilitiesRoutes);
app.use('/api/game-time', gameTimeRoutes);
app.use('/api/training', trainingRoutes);

// Google OAuth 2.0 인증 URL 생성
app.get('/api/auth/google', (req, res) => {
  try {
    const { authUrl, state } = AuthService.getGoogleAuthUrl();
    // state를 세션이나 쿠키에 저장 (CSRF 방지)
    res.cookie('oauth_state', state, { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600000 // 10분
    });
    res.json({ authUrl });
  } catch (error) {
    res.status(500).json({ error: '인증 URL 생성 실패' });
  }
});

// Google OAuth 2.0 콜백 처리
app.get('/api/auth/google/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    const storedState = req.cookies.oauth_state;

    // State 검증 (CSRF 방지)
    if (!state || state !== storedState) {
      return res.status(400).json({ error: '유효하지 않은 요청입니다.' });
    }

    // 인증 코드를 액세스 토큰으로 교환
    const tokenData = await AuthService.exchangeCodeForToken(code);
    
    // 사용자 정보 가져오기
    const googleUserInfo = await AuthService.getGoogleUserInfo(tokenData.access_token);
    
    // 사용자 생성 또는 조회
    const user = await AuthService.findOrCreateUser(googleUserInfo);
    
    // JWT 토큰 생성
    const jwtToken = AuthService.generateToken(user);

    // State 쿠키 삭제
    res.clearCookie('oauth_state');

    // 프론트엔드로 리다이렉트 (토큰 포함)
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}?token=${jwtToken}`);
  } catch (error) {
    console.error('OAuth 콜백 오류:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}?error=인증 실패`);
  }
});

// 현재 사용자 정보 (JWT 토큰 필요)
app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json(req.user);
});

// 로그아웃 (클라이언트에서 토큰 삭제)
app.post('/api/auth/logout', (req, res) => {
  res.json({ message: '로그아웃 성공' });
});

// Socket.IO 연결 관리
const activeUsers = new Map(); // IP별 활성 유저 추적

io.on('connection', (socket) => {
  const clientIp = socket.handshake.address || socket.request.ip;
  console.log(`✅ 클라이언트 연결: ${socket.id} (IP: ${clientIp})`);
  
  // IP별 유저 추가
  if (!activeUsers.has(clientIp)) {
    activeUsers.set(clientIp, new Set());
  }
  activeUsers.get(clientIp).add(socket.id);
  
  // 현재 유저 수 브로드캐스트
  const uniqueUserCount = activeUsers.size;
  io.emit('userCount', uniqueUserCount);
  
  socket.on('disconnect', () => {
    console.log(`❌ 클라이언트 연결 해제: ${socket.id}`);
    
    // IP별 유저 제거
    if (activeUsers.has(clientIp)) {
      activeUsers.get(clientIp).delete(socket.id);
      if (activeUsers.get(clientIp).size === 0) {
        activeUsers.delete(clientIp);
      }
    }
    
    // 업데이트된 유저 수 브로드캐스트
    const uniqueUserCount = activeUsers.size;
    io.emit('userCount', uniqueUserCount);
  });
});

// 기본 라우트
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'LOLFM 서버가 정상 작동 중입니다.',
    activeUsers: activeUsers.size
  });
});

// NotificationService에 io 전달 (순환 의존성 방지)
const NotificationService = require('./services/notificationService');
NotificationService.setIO(io);

// 게임 시간 자동 진행 시작 (6시간 = 1달)
const GameTimeService = require('./services/gameTimeService');
GameTimeService.startAutoAdvance(); // 6시간마다 1달 진행

// 게임오버 체크 미들웨어
const checkGameOver = async (req, res, next) => {
  if (req.user) {
    const conn = await pool.getConnection();
    try {
      const team = await conn.query(
        'SELECT is_game_over FROM teams WHERE user_id = ? LIMIT 1',
        [req.user.id]
      );
      if (team.length > 0 && team[0].is_game_over) {
        return res.status(403).json({ 
          error: '게임오버', 
          message: '파산으로 인해 계정이 영구 차단되었습니다.' 
        });
      }
    } catch (error) {
      console.error('게임오버 체크 오류:', error);
    } finally {
      conn.release();
    }
  }
  next();
};

// 게임오버 체크를 필요한 라우트에 적용 (인증된 사용자만)
app.use('/api/financial', authenticateToken, checkGameOver);
app.use('/api/teams', authenticateToken, checkGameOver);
// TODO: 다른 중요한 라우트에도 적용

// 서버 시작
server.listen(PORT, () => {
  console.log(`🚀 서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log(`📡 Socket.IO 서버가 활성화되었습니다.`);
  console.log(`⏰ 게임 시간 자동 진행이 시작되었습니다. (1시간 = 1달)`);
});

// 전역으로 내보내기 (하위 호환성 유지)
module.exports = { app, server, io, pool };

