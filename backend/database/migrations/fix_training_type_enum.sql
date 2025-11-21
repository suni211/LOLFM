-- training_type ENUM 확인 및 수정
-- player_trainings 테이블의 training_type이 ENUM('INDIVIDUAL', 'TEAM')인지 확인

-- 만약 다른 값이 들어가면 안 되므로, 잘못된 데이터가 있는지 확인
SELECT * FROM player_trainings WHERE training_type NOT IN ('INDIVIDUAL', 'TEAM');

-- training_type 컬럼이 올바른 ENUM인지 확인
SHOW COLUMNS FROM player_trainings LIKE 'training_type';

-- 필요시 ENUM 재정의 (기존 데이터가 있으면 주의)
-- ALTER TABLE player_trainings MODIFY COLUMN training_type ENUM('INDIVIDUAL', 'TEAM') NOT NULL;

