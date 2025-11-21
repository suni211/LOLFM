-- 스카우트 테이블 생성
CREATE TABLE IF NOT EXISTS scouts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  team_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  level INT DEFAULT 1, -- 스카우트 레벨 (1-5)
  discovery_rate DECIMAL(5,2) DEFAULT 10.0, -- 발견률 (%)
  cost_per_scout BIGINT DEFAULT 1000000, -- 스카우트 비용
  status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  INDEX idx_team (team_id),
  INDEX idx_level (level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 스카우트 결과 테이블
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

