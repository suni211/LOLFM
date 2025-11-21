const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mariadb = require('mariadb');
const http = require('http');
const { Server } = require('socket.io');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
  }
});

const PORT = process.env.PORT || 5000;

// 세션 설정
app.use(session({
  secret: process.env.SESSION_SECRET || 'lolfm-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // HTTPS 사용 시 true로 변경
}));

// Passport 초기화
app.use(passport.initialize());
app.use(passport.session());

// 미들웨어
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// IP 추출 미들웨어
app.use((req, res, next) => {
  const forwarded = req.headers['x-forwarded-for'];
  req.ip = forwarded ? forwarded.split(',')[0] : req.connection.remoteAddress || req.socket.remoteAddress;
  next();
});

// 데이터베이스 연결 풀 생성
const pool = mariadb.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'lolfm',
  connectionLimit: 5
});

// 데이터베이스 연결 테스트
pool.getConnection()
  .then(conn => {
    console.log('✅ MariaDB 연결 성공');
    conn.release();
  })
  .catch(err => {
    console.error('❌ MariaDB 연결 실패:', err);
  });

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

app.use('/api/financial', financialRoutes);
app.use('/api/players', playerRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/sponsors', sponsorRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/rankings', rankingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/transfer-market', transferMarketRoutes);
app.use('/api/teams', teamRoutes);

// 구글 OAuth 전략 설정
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // 사용자 정보를 데이터베이스에 저장하거나 조회
    const conn = await pool.getConnection();
    let user = await conn.query(
      'SELECT * FROM users WHERE google_id = ?',
      [profile.id]
    );
    
    if (user.length === 0) {
      // 새 사용자 생성
      await conn.query(
        `INSERT INTO users (google_id, email, name, picture, created_at) 
         VALUES (?, ?, ?, ?, NOW())`,
        [profile.id, profile.emails[0].value, profile.displayName, profile.photos[0].value]
      );
      user = await conn.query(
        'SELECT * FROM users WHERE google_id = ?',
        [profile.id]
      );
    }
    
    conn.release();
    return done(null, user[0]);
  } catch (error) {
    return done(error, null);
  }
}));

// Passport 직렬화
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const conn = await pool.getConnection();
    const users = await conn.query('SELECT * FROM users WHERE id = ?', [id]);
    conn.release();
    done(null, users[0]);
  } catch (error) {
    done(error, null);
  }
});

// 구글 OAuth 라우트
app.get('/api/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/api/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    // 성공 시 프론트엔드로 리다이렉트
    res.redirect(process.env.FRONTEND_URL || 'http://localhost:3000');
  }
);

// 로그아웃
app.get('/api/auth/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: '로그아웃 실패' });
    }
    res.json({ message: '로그아웃 성공' });
  });
});

// 현재 사용자 정보
app.get('/api/auth/me', (req, res) => {
  if (req.user) {
    res.json(req.user);
  } else {
    res.status(401).json({ error: '인증되지 않음' });
  }
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

// 게임오버 체크를 필요한 라우트에 적용
app.use('/api/financial', checkGameOver);
// TODO: 다른 중요한 라우트에도 적용

// 서버 시작
server.listen(PORT, () => {
  console.log(`🚀 서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log(`📡 Socket.IO 서버가 활성화되었습니다.`);
  console.log(`⏰ 게임 시간 자동 진행이 시작되었습니다. (1시간 = 1달)`);
});

// 데이터베이스 풀을 전역으로 내보내기
module.exports = { app, server, io, pool };

