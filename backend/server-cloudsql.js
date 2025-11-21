// Cloud SQL 연결을 위한 server.js 수정 예시
// 기존 server.js의 데이터베이스 연결 부분을 이렇게 수정하세요

const mariadb = require('mariadb');

// Cloud SQL 연결 설정
function createDatabasePool() {
  const dbHost = process.env.DB_HOST || 'localhost';
  
  // Cloud SQL Unix Socket 사용 (프로덕션)
  if (dbHost.startsWith('/cloudsql/')) {
    return mariadb.createPool({
      socketPath: dbHost,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'lolfm',
      connectionLimit: 5,
      ssl: {
        rejectUnauthorized: false
      }
    });
  }
  
  // 일반 TCP/IP 연결 (로컬 개발)
  return mariadb.createPool({
    host: dbHost,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'lolfm',
    connectionLimit: 5,
    ssl: process.env.NODE_ENV === 'production' ? {
      rejectUnauthorized: false
    } : false
  });
}

// 사용 예시
const pool = createDatabasePool();

// 나머지 코드는 동일...

