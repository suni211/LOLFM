-- 게임 초기화 스크립트
-- 게임 시간을 2024년 11월로 설정
INSERT INTO game_time (id, `current_date`, `current_month`, `current_year`, is_stove_league)
VALUES (1, '2024-11-01', 11, 2024, FALSE)
ON DUPLICATE KEY UPDATE
  `current_date` = '2024-11-01',
  `current_month` = 11,
  `current_year` = 2024,
  is_stove_league = FALSE;

-- 모든 팀 자금을 10억으로 설정
UPDATE teams SET money = 1000000000 WHERE money < 1000000000;

-- 모든 리그 순위 초기화
DELETE FROM league_standings;

-- 모든 경기 초기화
DELETE FROM matches;

-- 모든 훈련 기록 초기화
DELETE FROM player_trainings;

