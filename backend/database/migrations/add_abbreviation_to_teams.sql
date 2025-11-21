-- 팀 약자 컬럼 추가
ALTER TABLE teams ADD COLUMN abbreviation VARCHAR(10) AFTER name;

