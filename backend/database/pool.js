const mariadb = require('mariadb');
const dotenv = require('dotenv');

dotenv.config();

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

module.exports = pool;

