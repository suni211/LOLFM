# INSERT 문 수정 완료

## 문제
`INSERT ... SELECT ... ON DUPLICATE KEY UPDATE`에서 `VALUES()` 함수를 사용해야 합니다.

## 수정 사항

1. **regions INSERT**: `name=name` → `name=VALUES(name), full_name=VALUES(full_name)`
2. **leagues INSERT**: `name=name` → `name=VALUES(name)`, `max_teams=8` → `max_teams=VALUES(max_teams)`
3. **game_time INSERT**: `current_date=current_date` → `current_date=VALUES(current_date)` 등

## 적용 방법

GCP SSH에서:

```bash
# 최신 코드 가져오기
cd ~/LOLFM
git pull

# 수정된 스키마 적용
mysql -u lolfm_user -p lolfm < backend/database/schema.sql
```

또는 기존 데이터가 있다면:

```bash
# 기존 리그 데이터 삭제 후 재생성
mysql -u lolfm_user -p lolfm <<EOF
DELETE FROM leagues;
INSERT INTO leagues (region_id, division, name, max_teams) 
SELECT r.id, 1, CONCAT(r.full_name, ' 1부'), 8
FROM regions r
ON DUPLICATE KEY UPDATE max_teams=VALUES(max_teams), name=VALUES(name);

INSERT INTO leagues (region_id, division, name, max_teams) 
SELECT r.id, 2, CONCAT(r.full_name, ' 2부'), 10
FROM regions r
ON DUPLICATE KEY UPDATE max_teams=VALUES(max_teams), name=VALUES(name);
EOF
```

## 확인

```bash
mysql -u lolfm_user -p lolfm -e "SELECT * FROM leagues;"
mysql -u lolfm_user -p lolfm -e "SELECT * FROM regions;"
mysql -u lolfm_user -p lolfm -e "SELECT * FROM game_time;"
```

