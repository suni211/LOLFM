-- 모든 유저 데이터 초기화 스크립트
-- 주의: 이 스크립트는 모든 유저 팀, 선수, 경기 데이터를 삭제합니다.

SET FOREIGN_KEY_CHECKS = 0;

-- 유저 팀 삭제 (is_ai = FALSE 또는 user_id IS NOT NULL)
DELETE FROM teams WHERE is_ai = FALSE OR user_id IS NOT NULL;

-- 유저 선수 삭제 (is_ai = FALSE)
DELETE FROM players WHERE is_ai = FALSE;

-- 모든 경기 삭제
DELETE FROM matches;

-- 모든 리그 순위 삭제
DELETE FROM league_standings;

-- 모든 훈련 기록 삭제
DELETE FROM player_trainings;

-- 모든 협상 기록 삭제
DELETE FROM negotiations;

-- 모든 이적 시장 기록 삭제
DELETE FROM transfer_market;

-- 모든 알림 삭제
DELETE FROM notifications;

-- 모든 랜덤 이벤트 삭제
DELETE FROM random_events;

-- 모든 통계 기록 삭제
DELETE FROM team_statistics;
DELETE FROM player_statistics;

-- 모든 스폰서 계약 삭제
UPDATE teams SET current_sponsor_id = NULL;
DELETE FROM sponsors WHERE team_id IN (SELECT id FROM teams WHERE is_ai = TRUE);

SET FOREIGN_KEY_CHECKS = 1;

-- 게임 시간을 2024년 11월로 초기화
INSERT INTO game_time (id, `current_date`, `current_month`, `current_year`, is_stove_league)
VALUES (1, '2024-11-01', 11, 2024, FALSE)
ON DUPLICATE KEY UPDATE
  `current_date` = '2024-11-01',
  `current_month` = 11,
  `current_year` = 2024,
  is_stove_league = FALSE;

