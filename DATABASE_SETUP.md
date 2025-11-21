# MariaDB 데이터베이스 생성 가이드

## 1. MariaDB 접속

```bash
# root 사용자로 접속
sudo mysql -u root -p
```

비밀번호 입력 (설치 시 설정한 root 비밀번호)

## 2. 데이터베이스 생성

MariaDB에 접속한 후:

```sql
-- 데이터베이스 생성
CREATE DATABASE lolfm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 생성 확인
SHOW DATABASES;
```

## 3. 사용자 생성 및 권한 부여

```sql
-- 사용자 생성 (비밀번호는 원하는 것으로 변경)
CREATE USER 'lolfm_user'@'localhost' IDENTIFIED BY 'YOUR_PASSWORD';

-- 권한 부여
GRANT ALL PRIVILEGES ON lolfm.* TO 'lolfm_user'@'localhost';

-- 권한 새로고침
FLUSH PRIVILEGES;

-- 확인
SHOW GRANTS FOR 'lolfm_user'@'localhost';
```

## 4. 데이터베이스 선택 및 스키마 적용

```sql
-- 데이터베이스 선택
USE lolfm;

-- 또는 MariaDB에서 나온 후
EXIT;
```

터미널에서:

```bash
# 스키마 파일 적용
mysql -u lolfm_user -p lolfm < backend/database/schema.sql

# 마이그레이션 적용 (로고 컬럼 추가)
mysql -u lolfm_user -p lolfm < backend/database/migrations/add_logo_to_teams.sql
```

## 5. 테이블 생성 확인

```bash
# MariaDB 접속
mysql -u lolfm_user -p lolfm

# 테이블 목록 확인
SHOW TABLES;

# 특정 테이블 구조 확인
DESCRIBE teams;
DESCRIBE players;
```

## 6. 전체 스크립트 (한 번에 실행)

MariaDB에 접속한 후 다음을 복사해서 실행:

```sql
-- 데이터베이스 생성
CREATE DATABASE IF NOT EXISTS lolfm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 사용자 생성 (비밀번호 변경 필요!)
CREATE USER IF NOT EXISTS 'lolfm_user'@'localhost' IDENTIFIED BY 'YOUR_PASSWORD';

-- 권한 부여
GRANT ALL PRIVILEGES ON lolfm.* TO 'lolfm_user'@'localhost';

-- 권한 새로고침
FLUSH PRIVILEGES;

-- 확인
SHOW DATABASES;
SELECT User, Host FROM mysql.user WHERE User = 'lolfm_user';
```

## 7. 스키마 적용 (터미널에서)

```bash
# 프로젝트 디렉토리로 이동
cd ~/LOLFM

# 스키마 적용
mysql -u lolfm_user -p lolfm < backend/database/schema.sql

# 마이그레이션 적용
mysql -u lolfm_user -p lolfm < backend/database/migrations/add_logo_to_teams.sql
```

## 8. 연결 테스트

```bash
# 사용자로 접속 테스트
mysql -u lolfm_user -p lolfm

# 접속 후
SHOW TABLES;
SELECT * FROM regions;
EXIT;
```

## 9. 문제 해결

### 사용자가 이미 존재하는 경우
```sql
-- 기존 사용자 삭제 후 재생성
DROP USER IF EXISTS 'lolfm_user'@'localhost';
CREATE USER 'lolfm_user'@'localhost' IDENTIFIED BY 'YOUR_PASSWORD';
GRANT ALL PRIVILEGES ON lolfm.* TO 'lolfm_user'@'localhost';
FLUSH PRIVILEGES;
```

### 데이터베이스가 이미 존재하는 경우
```sql
-- 기존 데이터베이스 삭제 후 재생성 (주의: 모든 데이터 삭제됨!)
DROP DATABASE IF EXISTS lolfm;
CREATE DATABASE lolfm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 권한 오류 발생 시
```sql
-- 권한 다시 부여
GRANT ALL PRIVILEGES ON lolfm.* TO 'lolfm_user'@'localhost';
FLUSH PRIVILEGES;
```

## 10. .env 파일 설정

데이터베이스 생성 후 `backend/.env` 파일에 다음 정보 입력:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=lolfm_user
DB_PASSWORD=YOUR_PASSWORD
DB_NAME=lolfm
```

## 11. 체크리스트

- [ ] MariaDB 설치 완료
- [ ] root 비밀번호 설정 완료
- [ ] lolfm 데이터베이스 생성 완료
- [ ] lolfm_user 사용자 생성 완료
- [ ] 권한 부여 완료
- [ ] 스키마 파일 적용 완료
- [ ] 마이그레이션 파일 적용 완료
- [ ] 테이블 생성 확인 완료
- [ ] .env 파일 설정 완료
- [ ] 연결 테스트 완료

