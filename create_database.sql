-- LOLFM 데이터베이스 및 사용자 생성 스크립트
-- root 사용자로 MariaDB에 접속한 후 실행

-- 데이터베이스 생성
CREATE DATABASE IF NOT EXISTS lolfm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 사용자 생성 (비밀번호를 원하는 것으로 변경하세요!)
CREATE USER IF NOT EXISTS 'lolfm_user'@'localhost' IDENTIFIED BY 'CHANGE_THIS_PASSWORD';

-- 권한 부여
GRANT ALL PRIVILEGES ON lolfm.* TO 'lolfm_user'@'localhost';

-- 권한 새로고침
FLUSH PRIVILEGES;

-- 확인
SHOW DATABASES;
SELECT User, Host FROM mysql.user WHERE User = 'lolfm_user';

-- 사용법:
-- 1. sudo mysql -u root -p 로 접속
-- 2. 이 파일의 내용을 복사해서 실행
-- 3. CHANGE_THIS_PASSWORD를 원하는 비밀번호로 변경
-- 4. 스키마 파일 적용: mysql -u lolfm_user -p lolfm < backend/database/schema.sql

