-- player_trainings 테이블의 start_date, end_date를 NULL 허용으로 변경
-- 또는 기본값 설정

-- 방법 1: NULL 허용으로 변경
ALTER TABLE player_trainings 
MODIFY COLUMN start_date DATETIME NULL,
MODIFY COLUMN end_date DATETIME NULL;

-- 방법 2: 또는 기본값 설정 (현재 시간)
-- ALTER TABLE player_trainings 
-- MODIFY COLUMN start_date DATETIME DEFAULT CURRENT_TIMESTAMP,
-- MODIFY COLUMN end_date DATETIME DEFAULT CURRENT_TIMESTAMP;

