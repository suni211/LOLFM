# 스키마 최종 확인 및 적용 가이드

## 수정 완료 사항

✅ 모든 예약어 백틱 처리:
- `condition` → `` `condition` ``
- `current_date` → `` `current_date` ``
- `current_month` → `` `current_month` ``
- `current_year` → `` `current_year` ``

✅ INSERT 문 수정:
- `ON DUPLICATE KEY UPDATE` → `INSERT IGNORE` 사용
- MariaDB 호환성 개선

✅ ALTER TABLE 문 제거:
- `ADD COLUMN IF NOT EXISTS` 제거 (MariaDB 미지원)
- players 테이블에 age, retirement_date, stat_decline_rate 직접 포함

## GCP SSH에서 최종 적용

### 1단계: 최신 코드 가져오기

```bash
cd ~/LOLFM
git pull
```

### 2단계: 데이터베이스 재생성 (데이터가 없는 경우)

```bash
mysql -u root -p
DROP DATABASE IF EXISTS lolfm;
CREATE DATABASE lolfm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

### 3단계: 스키마 적용

```bash
mysql -u lolfm_user -p lolfm < backend/database/schema.sql
```

### 4단계: 마이그레이션 적용

```bash
mysql -u lolfm_user -p lolfm < backend/database/migrations/add_logo_to_teams.sql
```

### 5단계: 확인

```bash
# 테이블 목록 확인
mysql -u lolfm_user -p lolfm -e "SHOW TABLES;"

# 주요 테이블 구조 확인
mysql -u lolfm_user -p lolfm -e "DESCRIBE players;"
mysql -u lolfm_user -p lolfm -e "DESCRIBE game_time;"
mysql -u lolfm_user -p lolfm -e "DESCRIBE teams;"

# 초기 데이터 확인
mysql -u lolfm_user -p lolfm -e "SELECT * FROM regions;"
mysql -u lolfm_user -p lolfm -e "SELECT * FROM leagues;"
mysql -u lolfm_user -p lolfm -e "SELECT * FROM game_time;"
```

## 예상 결과

### regions 테이블
- ASL, AMEL, EL, AL 4개 지역

### leagues 테이블
- 각 지역별 1부 (8팀), 2부 (10팀) 총 8개 리그

### game_time 테이블
- current_date: 2024-01-01
- current_month: 1
- current_year: 2024
- is_stove_league: 0 (FALSE)

## 문제 해결

### 오류가 발생하는 경우

1. **테이블이 이미 존재하는 경우**
```bash
# 특정 테이블만 삭제
mysql -u lolfm_user -p lolfm -e "DROP TABLE IF EXISTS 테이블명;"
```

2. **외래 키 오류**
```bash
# 외래 키 체크 일시 비활성화
mysql -u lolfm_user -p lolfm <<EOF
SET FOREIGN_KEY_CHECKS = 0;
SOURCE backend/database/schema.sql;
SET FOREIGN_KEY_CHECKS = 1;
EOF
```

3. **전체 재생성**
```bash
mysql -u root -p <<EOF
DROP DATABASE IF EXISTS lolfm;
CREATE DATABASE lolfm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON lolfm.* TO 'lolfm_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
EOF

mysql -u lolfm_user -p lolfm < backend/database/schema.sql
```

## 다음 단계

스키마 적용이 완료되면:

1. ✅ 백엔드 서버 실행 테스트
2. ✅ 데이터베이스 연결 테스트
3. ✅ API 엔드포인트 테스트
4. ✅ 프론트엔드 연결 테스트

