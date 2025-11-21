# condition 컬럼 수정 완료

## 문제
`condition`은 MariaDB의 예약어이므로 백틱(`)으로 감싸야 합니다.

## 수정 사항

1. **schema.sql**: `condition` → `` `condition` ``
2. **playerService.js**: SQL 쿼리에서 `` `condition` `` 사용
3. **routes/players.js**: INSERT 쿼리에서 `` `condition` `` 사용

## 적용 방법

GCP SSH에서 다시 스키마를 적용하세요:

```bash
# 기존 테이블이 있다면 삭제 (주의: 데이터 삭제됨!)
mysql -u lolfm_user -p lolfm -e "DROP TABLE IF EXISTS players;"

# 수정된 스키마 적용
mysql -u lolfm_user -p lolfm < backend/database/schema.sql

# 마이그레이션 적용
mysql -u lolfm_user -p lolfm < backend/database/migrations/add_logo_to_teams.sql
```

또는 전체 데이터베이스를 다시 생성:

```bash
# 데이터베이스 삭제 후 재생성 (주의: 모든 데이터 삭제!)
mysql -u root -p
DROP DATABASE lolfm;
CREATE DATABASE lolfm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;

# 스키마 적용
mysql -u lolfm_user -p lolfm < backend/database/schema.sql
mysql -u lolfm_user -p lolfm < backend/database/migrations/add_logo_to_teams.sql
```

## 확인

```bash
mysql -u lolfm_user -p lolfm -e "DESCRIBE players;"
```

`condition` 컬럼이 정상적으로 생성되었는지 확인하세요.

