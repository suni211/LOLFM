g# 빠른 스키마 적용 가이드

## GCP SSH에서 한 번에 실행

```bash
cd ~/LOLFM
git pull
chmod +x backend/database/apply_schema.sh
./backend/database/apply_schema.sh
```

## 또는 수동으로

```bash
cd ~/LOLFM
git pull

# 스키마 적용
mysql -u lolfm_user -p lolfm < backend/database/schema.sql

# 마이그레이션 적용
mysql -u lolfm_user -p lolfm < backend/database/migrations/add_logo_to_teams.sql

# 확인
mysql -u lolfm_user -p lolfm -e "SHOW TABLES;"
mysql -u lolfm_user -p lolfm -e "SELECT * FROM regions;"
mysql -u lolfm_user -p lolfm -e "SELECT * FROM leagues;"
```

## 수정 완료된 내용

✅ `condition` → `` `condition` `` (예약어)
✅ `current_date` → `` `current_date` `` (예약어)  
✅ `current_month` → `` `current_month` `` (예약어)
✅ `current_year` → `` `current_year` `` (예약어)
✅ `INSERT ... ON DUPLICATE KEY UPDATE` → `INSERT IGNORE`
✅ `ADD COLUMN IF NOT EXISTS` 제거
✅ players 테이블에 age, retirement_date, stat_decline_rate 포함

## 예상 결과

- ✅ 30개 이상의 테이블 생성
- ✅ 4개 지역 (ASL, AMEL, EL, AL)
- ✅ 8개 리그 (각 지역별 1부, 2부)
- ✅ 초기 게임 시간 설정

