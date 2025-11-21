-- matches 테이블에 season_year 컬럼 추가

SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'matches' 
  AND COLUMN_NAME = 'season_year';

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE matches ADD COLUMN season_year INT NULL COMMENT ''시즌 연도''',
  'SELECT ''Column season_year already exists'' AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 기존 데이터에 현재 연도 설정
UPDATE matches SET season_year = YEAR(NOW()) WHERE season_year IS NULL;

