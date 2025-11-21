-- LOLFM 데이터베이스 스키마

-- 사용자 테이블
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  google_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  picture TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_google_id (google_id),
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 지역 테이블
CREATE TABLE IF NOT EXISTS regions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(10) UNIQUE NOT NULL, -- ASL, AMEL, EL, AL
  name VARCHAR(100) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 리그 테이블 (1부/2부)
CREATE TABLE IF NOT EXISTS leagues (
  id INT AUTO_INCREMENT PRIMARY KEY,
  region_id INT NOT NULL,
  division INT NOT NULL, -- 1: 1부, 2: 2부
  name VARCHAR(255) NOT NULL,
  max_teams INT DEFAULT 10,
  current_teams INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (region_id) REFERENCES regions(id) ON DELETE CASCADE,
  UNIQUE KEY unique_region_division (region_id, division),
  INDEX idx_region (region_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 팀 테이블
CREATE TABLE IF NOT EXISTS teams (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  region_id INT NOT NULL,
  league_id INT,
  name VARCHAR(255) NOT NULL,
  logo_path VARCHAR(500), -- 팀 로고 경로
  money BIGINT DEFAULT 100000000, -- 초기 자금 1억
  fans INT DEFAULT 0,
  reputation INT DEFAULT 0,
  awareness INT DEFAULT 0,
  is_bankrupt BOOLEAN DEFAULT FALSE, -- 파산 여부
  is_restructuring BOOLEAN DEFAULT FALSE, -- 구조조정 여부
  restructuring_count INT DEFAULT 0, -- 구조조정 횟수
  bankruptcy_date DATETIME, -- 파산 일시
  is_game_over BOOLEAN DEFAULT FALSE, -- 게임오버 여부 (계정 영구 차단)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (region_id) REFERENCES regions(id),
  FOREIGN KEY (league_id) REFERENCES leagues(id) ON DELETE SET NULL,
  INDEX idx_user (user_id),
  INDEX idx_region (region_id),
  INDEX idx_league (league_id),
  INDEX idx_bankrupt (is_bankrupt),
  INDEX idx_game_over (is_game_over)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 선수 테이블
CREATE TABLE IF NOT EXISTS players (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  nationality VARCHAR(100), -- 국적
  position ENUM('TOP', 'JGL', 'MID', 'ADC', 'SPT') NOT NULL,
  overall INT DEFAULT 50, -- 기본 오버롤
  potential INT DEFAULT 0, -- 포텐셜 (성장 가능성)
  mental INT DEFAULT 50, -- 멘탈 (1-100)
  teamfight INT DEFAULT 50, -- 한타력 (1-100)
  laning INT DEFAULT 50, -- 라인전 (1-100)
  jungling INT DEFAULT 50, -- 정글링 (1-100)
  cs_skill INT DEFAULT 50, -- CS 수급 (1-100)
  condition INT DEFAULT 50, -- 컨디션 (1-100)
  leadership INT DEFAULT 50, -- 오더력 (1-100)
  will INT DEFAULT 50, -- 의지 (1-100)
  competitiveness INT DEFAULT 50, -- 승부욕 (1-100)
  dirty_play INT DEFAULT 50, -- 더티 플레이 (1-100)
  team_id INT, -- 현재 소속 팀
  salary BIGINT DEFAULT 0, -- 주급
  contract_start DATE,
  contract_end DATE,
  is_ai BOOLEAN DEFAULT TRUE, -- AI 선수 여부
  is_custom BOOLEAN DEFAULT FALSE, -- 커스텀 선수 여부
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL,
  INDEX idx_team (team_id),
  INDEX idx_position (position),
  INDEX idx_nationality (nationality)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 장비 테이블
CREATE TABLE IF NOT EXISTS equipment (
  id INT AUTO_INCREMENT PRIMARY KEY,
  player_id INT NOT NULL,
  type ENUM('MOUSE', 'KEYBOARD', 'MOUSEPAD', 'HEADSET') NOT NULL,
  name VARCHAR(255) NOT NULL,
  stat_bonus JSON, -- 스탯 보너스 (각 스탯별 증가량)
  growth_bonus DECIMAL(5,2) DEFAULT 0, -- 성장 속도 보너스 (%)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
  INDEX idx_player (player_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 경기장 테이블
CREATE TABLE IF NOT EXISTS stadiums (
  id INT AUTO_INCREMENT PRIMARY KEY,
  team_id INT NOT NULL,
  level INT DEFAULT 1,
  name VARCHAR(255) NOT NULL,
  max_capacity INT DEFAULT 100,
  current_capacity INT DEFAULT 100,
  monthly_maintenance_cost BIGINT DEFAULT 0, -- 월 유지비
  upgrade_start_time DATETIME,
  upgrade_end_time DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  UNIQUE KEY unique_team_stadium (team_id),
  INDEX idx_team (team_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 숙소 테이블
CREATE TABLE IF NOT EXISTS dormitories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  team_id INT NOT NULL,
  level INT DEFAULT 1,
  condition_bonus INT DEFAULT 0, -- 컨디션 보너스 (+10~+30 랜덤)
  growth_bonus INT DEFAULT 0, -- 성장 보너스
  monthly_maintenance_cost BIGINT DEFAULT 0, -- 월 유지비
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  UNIQUE KEY unique_team_dormitory (team_id),
  INDEX idx_team (team_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 스폰서 테이블
CREATE TABLE IF NOT EXISTS sponsors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  team_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  star_rating INT NOT NULL, -- 1-5성
  monthly_support BIGINT DEFAULT 0, -- 월 지원금
  win_bonus BIGINT DEFAULT 0, -- 승리 보너스
  contract_start DATE,
  contract_end DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  INDEX idx_team (team_id),
  INDEX idx_rating (star_rating)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 경기 스케줄 테이블
CREATE TABLE IF NOT EXISTS matches (
  id INT AUTO_INCREMENT PRIMARY KEY,
  league_id INT NOT NULL,
  home_team_id INT NOT NULL,
  away_team_id INT NOT NULL,
  match_date DATETIME NOT NULL,
  is_home BOOLEAN DEFAULT TRUE,
  home_score INT DEFAULT 0,
  away_score INT DEFAULT 0,
  status ENUM('SCHEDULED', 'PLAYING', 'FINISHED') DEFAULT 'SCHEDULED',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (league_id) REFERENCES leagues(id) ON DELETE CASCADE,
  FOREIGN KEY (home_team_id) REFERENCES teams(id) ON DELETE CASCADE,
  FOREIGN KEY (away_team_id) REFERENCES teams(id) ON DELETE CASCADE,
  INDEX idx_league (league_id),
  INDEX idx_home_team (home_team_id),
  INDEX idx_away_team (away_team_id),
  INDEX idx_match_date (match_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 협상 테이블
CREATE TABLE IF NOT EXISTS negotiations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  player_id INT NOT NULL,
  from_team_id INT,
  to_team_id INT NOT NULL,
  type ENUM('TRANSFER', 'CONTRACT') NOT NULL, -- 이적, 계약
  salary_offer BIGINT,
  contract_duration INT, -- 계약 기간 (월)
  transfer_fee BIGINT, -- 이적료 (이적 시)
  status ENUM('PENDING', 'ACCEPTED', 'REJECTED') DEFAULT 'PENDING',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
  FOREIGN KEY (from_team_id) REFERENCES teams(id) ON DELETE SET NULL,
  FOREIGN KEY (to_team_id) REFERENCES teams(id) ON DELETE CASCADE,
  INDEX idx_player (player_id),
  INDEX idx_from_team (from_team_id),
  INDEX idx_to_team (to_team_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 게임 시간 테이블
CREATE TABLE IF NOT EXISTS game_time (
  id INT AUTO_INCREMENT PRIMARY KEY,
  current_date DATE NOT NULL,
  current_month INT NOT NULL,
  current_year INT NOT NULL,
  is_stove_league BOOLEAN DEFAULT FALSE, -- 스토브리그 여부
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_game_time (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 재정 이력 테이블 (수입/지출 기록)
CREATE TABLE IF NOT EXISTS financial_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  team_id INT NOT NULL,
  type ENUM('INCOME', 'EXPENSE') NOT NULL, -- 수입/지출
  category VARCHAR(100) NOT NULL, -- 카테고리 (주급, 유지비, 티켓, 스폰서 등)
  amount BIGINT NOT NULL,
  description TEXT,
  record_date DATE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  INDEX idx_team (team_id),
  INDEX idx_record_date (record_date),
  INDEX idx_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 파산/구조조정 이력 테이블
CREATE TABLE IF NOT EXISTS bankruptcy_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  team_id INT NOT NULL,
  event_type ENUM('WARNING', 'RESTRUCTURING', 'BANKRUPTCY', 'GAME_OVER') NOT NULL,
  money_before BIGINT NOT NULL,
  money_after BIGINT NOT NULL,
  details JSON, -- 상세 정보 (해고된 선수, 시설 하락 등)
  event_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  INDEX idx_team (team_id),
  INDEX idx_event_type (event_type),
  INDEX idx_event_date (event_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 훈련장 테이블
CREATE TABLE IF NOT EXISTS training_facilities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  team_id INT NOT NULL,
  level INT DEFAULT 1,
  growth_bonus DECIMAL(5,2) DEFAULT 0, -- 성장 속도 보너스 (%)
  max_trainees INT DEFAULT 5, -- 최대 동시 훈련 인원
  monthly_maintenance_cost BIGINT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  UNIQUE KEY unique_team_training (team_id),
  INDEX idx_team (team_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 의료실 테이블
CREATE TABLE IF NOT EXISTS medical_rooms (
  id INT AUTO_INCREMENT PRIMARY KEY,
  team_id INT NOT NULL,
  level INT DEFAULT 1,
  recovery_speed_bonus DECIMAL(5,2) DEFAULT 0, -- 회복 속도 보너스 (%)
  condition_recovery_bonus DECIMAL(5,2) DEFAULT 0, -- 컨디션 회복 보너스 (%)
  monthly_maintenance_cost BIGINT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  UNIQUE KEY unique_team_medical (team_id),
  INDEX idx_team (team_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 미디어룸 테이블
CREATE TABLE IF NOT EXISTS media_rooms (
  id INT AUTO_INCREMENT PRIMARY KEY,
  team_id INT NOT NULL,
  level INT DEFAULT 1,
  awareness_bonus DECIMAL(5,2) DEFAULT 0, -- 인지도 증가 보너스 (%)
  fan_growth_bonus DECIMAL(5,2) DEFAULT 0, -- 팬 증가 보너스 (%)
  monthly_maintenance_cost BIGINT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  UNIQUE KEY unique_team_media (team_id),
  INDEX idx_team (team_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 선수 훈련 테이블
CREATE TABLE IF NOT EXISTS player_trainings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  player_id INT NOT NULL,
  training_type ENUM('INDIVIDUAL', 'TEAM') NOT NULL, -- 개인 훈련, 팀 훈련
  focus_stat VARCHAR(50), -- 집중 훈련 스탯
  start_date DATETIME NOT NULL,
  end_date DATETIME NOT NULL,
  status ENUM('ACTIVE', 'COMPLETED', 'CANCELLED') DEFAULT 'ACTIVE',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
  INDEX idx_player (player_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 선수 부상 테이블
CREATE TABLE IF NOT EXISTS player_injuries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  player_id INT NOT NULL,
  injury_type VARCHAR(100) NOT NULL,
  severity INT DEFAULT 1, -- 심각도 (1-5)
  recovery_days INT NOT NULL, -- 회복 일수
  start_date DATE NOT NULL,
  end_date DATE,
  status ENUM('ACTIVE', 'RECOVERED') DEFAULT 'ACTIVE',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
  INDEX idx_player (player_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 선수 나이 및 은퇴 정보 추가
ALTER TABLE players 
ADD COLUMN IF NOT EXISTS age INT DEFAULT 18,
ADD COLUMN IF NOT EXISTS retirement_date DATE,
ADD COLUMN IF NOT EXISTS stat_decline_rate DECIMAL(5,2) DEFAULT 0; -- 스탯 감소율

-- 에이전트 테이블
CREATE TABLE IF NOT EXISTS agents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  level INT DEFAULT 1, -- 에이전트 레벨 (1-5)
  commission_rate DECIMAL(5,2) DEFAULT 5.0, -- 수수료율 (%)
  negotiation_skill INT DEFAULT 50, -- 협상 능력 (1-100)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_level (level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 선수 만족도 테이블
CREATE TABLE IF NOT EXISTS player_satisfaction (
  id INT AUTO_INCREMENT PRIMARY KEY,
  player_id INT NOT NULL,
  satisfaction_score INT DEFAULT 50, -- 만족도 (1-100)
  salary_satisfaction INT DEFAULT 50,
  team_performance_satisfaction INT DEFAULT 50,
  facility_satisfaction INT DEFAULT 50,
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
  UNIQUE KEY unique_player_satisfaction (player_id),
  INDEX idx_player (player_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 협상에 에이전트 추가
ALTER TABLE negotiations
ADD COLUMN IF NOT EXISTS agent_id INT,
ADD FOREIGN KEY IF NOT EXISTS fk_agent (agent_id) REFERENCES agents(id) ON DELETE SET NULL;

-- 리그 순위 테이블
CREATE TABLE IF NOT EXISTS league_standings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  league_id INT NOT NULL,
  team_id INT NOT NULL,
  season_year INT NOT NULL,
  wins INT DEFAULT 0,
  losses INT DEFAULT 0,
  draws INT DEFAULT 0,
  points INT DEFAULT 0, -- 승점
  goal_difference INT DEFAULT 0, -- 득실차
  rank INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (league_id) REFERENCES leagues(id) ON DELETE CASCADE,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  UNIQUE KEY unique_league_team_season (league_id, team_id, season_year),
  INDEX idx_league (league_id),
  INDEX idx_team (team_id),
  INDEX idx_rank (rank)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 플레이오프 테이블
CREATE TABLE IF NOT EXISTS playoffs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  league_id INT NOT NULL,
  season_year INT NOT NULL,
  round ENUM('QUARTERFINAL', 'SEMIFINAL', 'FINAL') NOT NULL,
  home_team_id INT NOT NULL,
  away_team_id INT NOT NULL,
  home_score INT DEFAULT 0,
  away_score INT DEFAULT 0,
  match_date DATETIME NOT NULL,
  status ENUM('SCHEDULED', 'PLAYING', 'FINISHED') DEFAULT 'SCHEDULED',
  winner_team_id INT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (league_id) REFERENCES leagues(id) ON DELETE CASCADE,
  FOREIGN KEY (home_team_id) REFERENCES teams(id) ON DELETE CASCADE,
  FOREIGN KEY (away_team_id) REFERENCES teams(id) ON DELETE CASCADE,
  FOREIGN KEY (winner_team_id) REFERENCES teams(id) ON DELETE SET NULL,
  INDEX idx_league (league_id),
  INDEX idx_season (season_year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 월즈 챔피언십 테이블
CREATE TABLE IF NOT EXISTS world_championships (
  id INT AUTO_INCREMENT PRIMARY KEY,
  season_year INT NOT NULL,
  round ENUM('GROUP', 'QUARTERFINAL', 'SEMIFINAL', 'FINAL') NOT NULL,
  team_id INT NOT NULL,
  opponent_team_id INT,
  team_score INT DEFAULT 0,
  opponent_score INT DEFAULT 0,
  match_date DATETIME NOT NULL,
  status ENUM('SCHEDULED', 'PLAYING', 'FINISHED') DEFAULT 'SCHEDULED',
  winner_team_id INT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  FOREIGN KEY (opponent_team_id) REFERENCES teams(id) ON DELETE SET NULL,
  FOREIGN KEY (winner_team_id) REFERENCES teams(id) ON DELETE SET NULL,
  INDEX idx_season (season_year),
  INDEX idx_round (round)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 월즈 보상 테이블
CREATE TABLE IF NOT EXISTS world_championship_rewards (
  id INT AUTO_INCREMENT PRIMARY KEY,
  team_id INT NOT NULL,
  championship_id INT NOT NULL,
  rank INT NOT NULL,
  cash_reward BIGINT DEFAULT 0,
  awareness_bonus INT DEFAULT 0,
  fan_bonus INT DEFAULT 0,
  reward_date DATE NOT NULL,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  FOREIGN KEY (championship_id) REFERENCES world_championships(id) ON DELETE CASCADE,
  INDEX idx_team (team_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 선수 통계 테이블
CREATE TABLE IF NOT EXISTS player_statistics (
  id INT AUTO_INCREMENT PRIMARY KEY,
  player_id INT NOT NULL,
  match_id INT,
  season_year INT NOT NULL,
  kills INT DEFAULT 0,
  deaths INT DEFAULT 0,
  assists INT DEFAULT 0,
  cs INT DEFAULT 0, -- CS 수
  gold INT DEFAULT 0,
  damage_dealt INT DEFAULT 0,
  damage_taken INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
  FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE SET NULL,
  INDEX idx_player (player_id),
  INDEX idx_season (season_year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 팀 통계 테이블
CREATE TABLE IF NOT EXISTS team_statistics (
  id INT AUTO_INCREMENT PRIMARY KEY,
  team_id INT NOT NULL,
  season_year INT NOT NULL,
  total_wins INT DEFAULT 0,
  total_losses INT DEFAULT 0,
  league_titles INT DEFAULT 0,
  world_championships INT DEFAULT 0,
  total_revenue BIGINT DEFAULT 0,
  total_expenses BIGINT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  UNIQUE KEY unique_team_season (team_id, season_year),
  INDEX idx_team (team_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 랭킹 테이블
CREATE TABLE IF NOT EXISTS rankings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  team_id INT NOT NULL,
  ranking_type ENUM('MONEY', 'FANS', 'AWARENESS', 'WORLD_CHAMPIONSHIPS') NOT NULL,
  rank INT NOT NULL,
  value BIGINT NOT NULL, -- 랭킹 기준 값
  season_year INT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  INDEX idx_team (team_id),
  INDEX idx_type (ranking_type),
  INDEX idx_rank (rank)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 거래 시장 테이블
CREATE TABLE IF NOT EXISTS transfer_market (
  id INT AUTO_INCREMENT PRIMARY KEY,
  player_id INT NOT NULL,
  seller_team_id INT NOT NULL,
  buyer_team_id INT,
  asking_price BIGINT NOT NULL,
  transfer_fee BIGINT DEFAULT 0,
  status ENUM('OPEN', 'NEGOTIATING', 'COMPLETED', 'CANCELLED') DEFAULT 'OPEN',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
  FOREIGN KEY (seller_team_id) REFERENCES teams(id) ON DELETE CASCADE,
  FOREIGN KEY (buyer_team_id) REFERENCES teams(id) ON DELETE SET NULL,
  INDEX idx_player (player_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 알림 테이블
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  team_id INT,
  type VARCHAR(100) NOT NULL, -- 알림 타입
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  priority ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT') DEFAULT 'MEDIUM',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_read (is_read),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 랜덤 이벤트 테이블
CREATE TABLE IF NOT EXISTS random_events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  team_id INT,
  event_type ENUM('PLAYER_INJURY', 'SPONSOR_OFFER', 'SPECIAL_BONUS', 'PLAYER_RETIREMENT', 'FAN_EVENT') NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  effect JSON, -- 이벤트 효과
  event_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_processed BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  INDEX idx_team (team_id),
  INDEX idx_type (event_type),
  INDEX idx_processed (is_processed)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 경기 전술 테이블
CREATE TABLE IF NOT EXISTS match_tactics (
  id INT AUTO_INCREMENT PRIMARY KEY,
  match_id INT NOT NULL,
  team_id INT NOT NULL,
  tactic_type ENUM('AGGRESSIVE', 'DEFENSIVE', 'BALANCED') DEFAULT 'BALANCED',
  ban_picks JSON, -- 밴픽 정보
  proficiency INT DEFAULT 50, -- 전술 숙련도
  FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  INDEX idx_match (match_id),
  INDEX idx_team (team_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 초기 지역 데이터 삽입
INSERT INTO regions (code, name, full_name) VALUES
('ASL', 'ASIA', 'ASL SUPER LEAGUE'),
('AMEL', 'AMERICA', 'AMEL LIGA'),
('EL', 'EUROPE', 'ELL'),
('AL', 'AFRICA', 'ALO')
ON DUPLICATE KEY UPDATE name=name;

-- 각 지역의 1부, 2부 리그 생성 (1부 8팀, 2부 10팀)
INSERT INTO leagues (region_id, division, name, max_teams) 
SELECT r.id, 1, CONCAT(r.full_name, ' 1부'), 8
FROM regions r
ON DUPLICATE KEY UPDATE max_teams=8, name=name;

INSERT INTO leagues (region_id, division, name, max_teams) 
SELECT r.id, 2, CONCAT(r.full_name, ' 2부'), 10
FROM regions r
ON DUPLICATE KEY UPDATE max_teams=10, name=name;

-- 초기 게임 시간 설정 (1월 1일)
INSERT INTO game_time (current_date, current_month, current_year, is_stove_league) 
VALUES ('2024-01-01', 1, 2024, FALSE)
ON DUPLICATE KEY UPDATE current_date=current_date;

