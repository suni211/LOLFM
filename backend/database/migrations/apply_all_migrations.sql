-- 모든 마이그레이션을 안전하게 적용하는 스크립트
-- 이미 적용된 마이그레이션은 자동으로 건너뜀

-- 1. teams 테이블의 user_id를 NULL 허용으로 변경
SET @col_nullable = 0;
SELECT COUNT(*) INTO @col_nullable 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'teams' 
  AND COLUMN_NAME = 'user_id'
  AND IS_NULLABLE = 'YES';

SET @sql = IF(@col_nullable = 0,
  'ALTER TABLE teams MODIFY COLUMN user_id INT NULL',
  'SELECT ''Column user_id is already nullable'' AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2. matches 테이블에 is_friendly 컬럼 추가
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

-- 3. matches 테이블의 league_id를 NULL 허용으로 변경
SET @sql = 'ALTER TABLE matches MODIFY COLUMN league_id INT NULL COMMENT ''리그 ID (친선 경기는 NULL)''';
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 4. 친선 경기 인덱스 추가
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

-- 5. 스카우트 테이블 생성
CREATE TABLE IF NOT EXISTS scouts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  team_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  level INT DEFAULT 1,
  discovery_rate DECIMAL(5,2) DEFAULT 10.0,
  cost_per_scout BIGINT DEFAULT 1000000,
  status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  INDEX idx_team (team_id),
  INDEX idx_level (level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. 스카우트 결과 테이블 생성
CREATE TABLE IF NOT EXISTS scout_results (
  id INT AUTO_INCREMENT PRIMARY KEY,
  scout_id INT NOT NULL,
  team_id INT NOT NULL,
  player_id INT,
  discovered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  status ENUM('NEW', 'VIEWED', 'RECRUITED') DEFAULT 'NEW',
  FOREIGN KEY (scout_id) REFERENCES scouts(id) ON DELETE CASCADE,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE SET NULL,
  INDEX idx_scout (scout_id),
  INDEX idx_team (team_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT 'All migrations applied successfully!' AS result;

