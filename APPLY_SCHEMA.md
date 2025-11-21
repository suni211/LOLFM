# 스키마 적용 가이드 (수정 완료)

## 수정 사항

1. ✅ `condition` → `` `condition` `` (예약어)
2. ✅ `current_date` → `` `current_date` `` (예약어)
3. ✅ `current_month` → `` `current_month` `` (예약어)
4. ✅ `current_year` → `` `current_year` `` (예약어)
5. ✅ `ADD COLUMN IF NOT EXISTS` 제거 (MariaDB 미지원)
6. ✅ players 테이블에 age, retirement_date, stat_decline_rate 컬럼 포함

## GCP SSH에서 적용 방법

### 방법 1: 전체 재생성 (권장, 데이터가 없는 경우)

```bash
# 최신 코드 가져오기
cd ~/LOLFM
git pull

# 데이터베이스 삭제 후 재생성
mysql -u root -p
DROP DATABASE IF EXISTS lolfm;
CREATE DATABASE lolfm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;

# 스키마 적용
mysql -u lolfm_user -p lolfm < backend/database/schema.sql

# 마이그레이션 적용
mysql -u lolfm_user -p lolfm < backend/database/migrations/add_logo_to_teams.sql
```

### 방법 2: 문제가 있는 테이블만 삭제 후 재생성

```bash
# 최신 코드 가져오기
cd ~/LOLFM
git pull

# 문제가 있는 테이블 삭제
mysql -u lolfm_user -p lolfm <<EOF
DROP TABLE IF EXISTS game_time;
DROP TABLE IF EXISTS players;
EOF

# 스키마 적용
mysql -u lolfm_user -p lolfm < backend/database/schema.sql
```

### 방법 3: 특정 테이블만 수정

```bash
# game_time 테이블만 재생성
mysql -u lolfm_user -p lolfm <<EOF
DROP TABLE IF EXISTS game_time;
CREATE TABLE game_time (
  id INT AUTO_INCREMENT PRIMARY KEY,
  \`current_date\` DATE NOT NULL,
  \`current_month\` INT NOT NULL,
  \`current_year\` INT NOT NULL,
  is_stove_league BOOLEAN DEFAULT FALSE,
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_game_time (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO game_time (\`current_date\`, \`current_month\`, \`current_year\`, is_stove_league) 
VALUES ('2024-01-01', 1, 2024, FALSE);
EOF
```

## 확인

```bash
# 테이블 목록 확인
mysql -u lolfm_user -p lolfm -e "SHOW TABLES;"

# players 테이블 구조 확인
mysql -u lolfm_user -p lolfm -e "DESCRIBE players;"

# game_time 테이블 구조 확인
mysql -u lolfm_user -p lolfm -e "DESCRIBE game_time;"

# 데이터 확인
mysql -u lolfm_user -p lolfm -e "SELECT * FROM regions;"
mysql -u lolfm_user -p lolfm -e "SELECT * FROM game_time;"
```

## 예상되는 테이블 목록

다음 테이블들이 생성되어야 합니다:
- users
- regions
- leagues
- teams
- players
- equipment
- stadiums
- dormitories
- sponsors
- matches
- negotiations
- game_time
- financial_records
- bankruptcy_history
- training_facilities
- medical_rooms
- media_rooms
- player_trainings
- player_injuries
- agents
- player_satisfaction
- league_standings
- playoffs
- world_championships
- world_championship_rewards
- player_statistics
- team_statistics
- rankings
- transfer_market
- notifications
- random_events
- match_tactics

## 문제 해결

### 테이블이 이미 존재하는 경우
```bash
# 특정 테이블 삭제
mysql -u lolfm_user -p lolfm -e "DROP TABLE IF EXISTS 테이블명;"

# 스키마 재적용
mysql -u lolfm_user -p lolfm < backend/database/schema.sql
```

### 외래 키 오류 발생 시
```bash
# 외래 키 체크 비활성화
mysql -u lolfm_user -p lolfm <<EOF
SET FOREIGN_KEY_CHECKS = 0;
-- 스키마 적용
SET FOREIGN_KEY_CHECKS = 1;
EOF
```

