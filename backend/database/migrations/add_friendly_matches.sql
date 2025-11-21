-- 친선 경기 시스템 추가
-- matches 테이블에 is_friendly 컬럼 추가 및 league_id를 NULL 허용

-- is_friendly 컬럼이 없으면 추가
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'matches' 
  AND COLUMN_NAME = 'is_friendly';

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE matches ADD COLUMN is_friendly BOOLEAN DEFAULT FALSE COMMENT ''친선 경기 여부''',
  'SELECT ''Column is_friendly already exists'' AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- league_id를 NULL 허용으로 변경 (이미 NULL 허용이면 에러 무시)
SET @sql = 'ALTER TABLE matches MODIFY COLUMN league_id INT NULL COMMENT ''리그 ID (친선 경기는 NULL)''';
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 친선 경기 인덱스 추가 (이미 존재하면 에러 무시)
SET @index_exists = 0;
SELECT COUNT(*) INTO @index_exists 
FROM INFORMATION_SCHEMA.STATISTICS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'matches' 
  AND INDEX_NAME = 'idx_friendly';

SET @sql = IF(@index_exists = 0,
  'ALTER TABLE matches ADD INDEX idx_friendly (is_friendly, match_date)',
  'SELECT ''Index idx_friendly already exists'' AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

