# MariaDB 예약어 수정 완료

## 수정된 예약어

1. **`condition`** → `` `condition` ``
2. **`current_date`** → `` `current_date` ``
3. **`current_month`** → `` `current_month` ``
4. **`current_year`** → `` `current_year` ``

## 수정된 파일

1. `backend/database/schema.sql` - 테이블 생성 및 INSERT 쿼리
2. `backend/services/playerService.js` - condition 컬럼 사용
3. `backend/services/gameTimeService.js` - current_date, current_month, current_year 사용
4. `backend/services/matchService.js` - current_year 사용
5. `backend/routes/players.js` - condition 컬럼 사용
6. `backend/routes/matches.js` - current_year 사용

## 적용 방법

GCP SSH에서:

```bash
# 최신 코드 가져오기
git pull

# 기존 game_time 테이블 삭제 (있다면)
mysql -u lolfm_user -p lolfm -e "DROP TABLE IF EXISTS game_time;"

# 수정된 스키마 적용
mysql -u lolfm_user -p lolfm < backend/database/schema.sql

# 마이그레이션 적용
mysql -u lolfm_user -p lolfm < backend/database/migrations/add_logo_to_teams.sql
```

또는 전체 재생성:

```bash
mysql -u root -p
DROP DATABASE lolfm;
CREATE DATABASE lolfm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;

mysql -u lolfm_user -p lolfm < backend/database/schema.sql
mysql -u lolfm_user -p lolfm < backend/database/migrations/add_logo_to_teams.sql
```

## 확인

```bash
mysql -u lolfm_user -p lolfm -e "DESCRIBE game_time;"
mysql -u lolfm_user -p lolfm -e "DESCRIBE players;"
```

모든 컬럼이 정상적으로 생성되었는지 확인하세요.

