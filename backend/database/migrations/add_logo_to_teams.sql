-- 팀 테이블에 로고 경로 컬럼 추가
ALTER TABLE teams 
ADD COLUMN IF NOT EXISTS logo_path VARCHAR(500) AFTER name;

