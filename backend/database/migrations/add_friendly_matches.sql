-- 친선 경기 시스템 추가
-- matches 테이블에 is_friendly 컬럼 추가 및 league_id를 NULL 허용

ALTER TABLE matches 
  ADD COLUMN is_friendly BOOLEAN DEFAULT FALSE COMMENT '친선 경기 여부',
  MODIFY COLUMN league_id INT NULL COMMENT '리그 ID (친선 경기는 NULL)';

-- 친선 경기 인덱스 추가
ALTER TABLE matches ADD INDEX idx_friendly (is_friendly, match_date);

