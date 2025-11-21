-- 누락된 컬럼 추가 마이그레이션

-- teams 테이블에 formation 컬럼 추가
ALTER TABLE teams 
ADD COLUMN formation TEXT COMMENT '포메이션 JSON';

-- teams 테이블에 current_sponsor_id 컬럼 추가
ALTER TABLE teams 
ADD COLUMN current_sponsor_id INT NULL COMMENT '현재 스폰서 ID';

ALTER TABLE teams 
ADD INDEX idx_current_sponsor (current_sponsor_id);

-- league_standings 테이블에 goals_for, goals_against 컬럼 추가
ALTER TABLE league_standings 
ADD COLUMN goals_for INT DEFAULT 0 COMMENT '득점',
ADD COLUMN goals_against INT DEFAULT 0 COMMENT '실점';

-- player_trainings 테이블에 training_year, training_month 컬럼 추가
ALTER TABLE player_trainings 
ADD COLUMN training_year INT NULL COMMENT '훈련 연도',
ADD COLUMN training_month INT NULL COMMENT '훈련 월',
ADD COLUMN stat_increase INT DEFAULT 0 COMMENT '스탯 증가량';

-- players 테이블에 last_trained_month, last_trained_year 컬럼 추가
ALTER TABLE players 
ADD COLUMN last_trained_month INT NULL COMMENT '마지막 훈련 월',
ADD COLUMN last_trained_year INT NULL COMMENT '마지막 훈련 연도';

