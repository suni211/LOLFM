-- 프리 에이전트 선수 생성 (포지션별 10명씩)

-- TOP 선수들
INSERT INTO players (name, position, nationality, overall, potential, mental, teamfight, laning, jungling, cs_skill, `condition`, leadership, will, competitiveness, dirty_play, is_ai) VALUES
('김탑라인', 'TOP', 'KR', 55, 75, 60, 65, 70, 30, 60, 90, 55, 70, 65, 25, TRUE),
('이탑솔로', 'TOP', 'KR', 52, 72, 55, 60, 65, 25, 58, 88, 50, 65, 60, 30, TRUE),
('박탑왕', 'TOP', 'KR', 58, 78, 65, 70, 75, 35, 65, 92, 60, 75, 70, 20, TRUE),
('최탑러', 'TOP', 'KR', 50, 70, 52, 58, 62, 28, 55, 85, 48, 62, 58, 28, TRUE),
('정탑신', 'TOP', 'KR', 56, 76, 62, 68, 72, 32, 62, 90, 58, 72, 68, 22, TRUE),
('강탑혁', 'TOP', 'KR', 54, 74, 58, 63, 68, 30, 60, 88, 54, 68, 63, 26, TRUE),
('조탑현', 'TOP', 'KR', 57, 77, 63, 69, 74, 33, 64, 91, 59, 74, 69, 21, TRUE),
('윤탑우', 'TOP', 'KR', 51, 71, 54, 59, 64, 27, 57, 86, 51, 64, 59, 29, TRUE),
('장탑민', 'TOP', 'KR', 53, 73, 57, 62, 67, 29, 59, 87, 53, 67, 62, 27, TRUE),
('임탑석', 'TOP', 'KR', 59, 79, 66, 71, 76, 36, 66, 93, 61, 76, 71, 19, TRUE);

-- JGL 선수들
INSERT INTO players (name, position, nationality, overall, potential, mental, teamfight, laning, jungling, cs_skill, `condition`, leadership, will, competitiveness, dirty_play, is_ai) VALUES
('김정글러', 'JGL', 'KR', 56, 76, 62, 68, 40, 85, 65, 90, 70, 72, 68, 22, TRUE),
('이정글왕', 'JGL', 'KR', 54, 74, 60, 65, 38, 82, 62, 88, 68, 68, 65, 25, TRUE),
('박정글신', 'JGL', 'KR', 58, 78, 65, 70, 42, 88, 68, 92, 72, 75, 70, 20, TRUE),
('최정글혁', 'JGL', 'KR', 52, 72, 58, 63, 36, 80, 60, 86, 66, 66, 63, 27, TRUE),
('정정글호', 'JGL', 'KR', 57, 77, 63, 69, 41, 86, 67, 91, 71, 74, 69, 21, TRUE),
('강정글우', 'JGL', 'KR', 55, 75, 61, 67, 39, 83, 64, 89, 69, 70, 67, 23, TRUE),
('조정글민', 'JGL', 'KR', 59, 79, 66, 71, 43, 89, 69, 93, 73, 76, 71, 19, TRUE),
('윤정글석', 'JGL', 'KR', 53, 73, 59, 64, 37, 81, 61, 87, 67, 67, 64, 26, TRUE),
('장정글현', 'JGL', 'KR', 56, 76, 62, 68, 40, 84, 65, 90, 70, 72, 68, 22, TRUE),
('임정글수', 'JGL', 'KR', 60, 80, 67, 72, 44, 90, 70, 94, 74, 77, 72, 18, TRUE);

-- MID 선수들
INSERT INTO players (name, position, nationality, overall, potential, mental, teamfight, laning, jungling, cs_skill, `condition`, leadership, will, competitiveness, dirty_play, is_ai) VALUES
('김미드러', 'MID', 'KR', 57, 77, 65, 72, 75, 35, 70, 91, 68, 74, 72, 20, TRUE),
('이미드왕', 'MID', 'KR', 55, 75, 63, 70, 72, 33, 68, 89, 66, 72, 70, 22, TRUE),
('박미드신', 'MID', 'KR', 59, 79, 67, 74, 78, 37, 72, 93, 70, 76, 74, 18, TRUE),
('최미드호', 'MID', 'KR', 53, 73, 61, 68, 70, 31, 66, 87, 64, 70, 68, 24, TRUE),
('정미드혁', 'MID', 'KR', 58, 78, 66, 73, 76, 36, 71, 92, 69, 75, 73, 19, TRUE),
('강미드우', 'MID', 'KR', 56, 76, 64, 71, 74, 34, 69, 90, 67, 73, 71, 21, TRUE),
('조미드민', 'MID', 'KR', 60, 80, 68, 75, 79, 38, 73, 94, 71, 77, 75, 17, TRUE),
('윤미드석', 'MID', 'KR', 54, 74, 62, 69, 71, 32, 67, 88, 65, 71, 69, 23, TRUE),
('장미드현', 'MID', 'KR', 57, 77, 65, 72, 75, 35, 70, 91, 68, 74, 72, 20, TRUE),
('임미드수', 'MID', 'KR', 61, 81, 69, 76, 80, 39, 74, 95, 72, 78, 76, 16, TRUE);

-- ADC 선수들
INSERT INTO players (name, position, nationality, overall, potential, mental, teamfight, laning, jungling, cs_skill, `condition`, leadership, will, competitiveness, dirty_play, is_ai) VALUES
('김원딜러', 'ADC', 'KR', 56, 76, 60, 70, 72, 25, 75, 90, 55, 72, 70, 18, TRUE),
('이원딜왕', 'ADC', 'KR', 54, 74, 58, 68, 70, 23, 73, 88, 53, 70, 68, 20, TRUE),
('박원딜신', 'ADC', 'KR', 58, 78, 62, 72, 74, 27, 77, 92, 57, 74, 72, 16, TRUE),
('최원딜호', 'ADC', 'KR', 52, 72, 56, 66, 68, 21, 71, 86, 51, 68, 66, 22, TRUE),
('정원딜혁', 'ADC', 'KR', 57, 77, 61, 71, 73, 26, 76, 91, 56, 73, 71, 17, TRUE),
('강원딜우', 'ADC', 'KR', 55, 75, 59, 69, 71, 24, 74, 89, 54, 71, 69, 19, TRUE),
('조원딜민', 'ADC', 'KR', 59, 79, 63, 73, 75, 28, 78, 93, 58, 75, 73, 15, TRUE),
('윤원딜석', 'ADC', 'KR', 53, 73, 57, 67, 69, 22, 72, 87, 52, 69, 67, 21, TRUE),
('장원딜현', 'ADC', 'KR', 56, 76, 60, 70, 72, 25, 75, 90, 55, 72, 70, 18, TRUE),
('임원딜수', 'ADC', 'KR', 60, 80, 64, 74, 76, 29, 79, 94, 59, 76, 74, 14, TRUE);

-- SPT 선수들
INSERT INTO players (name, position, nationality, overall, potential, mental, teamfight, laning, jungling, cs_skill, `condition`, leadership, will, competitiveness, dirty_play, is_ai) VALUES
('김서포터', 'SPT', 'KR', 55, 75, 70, 75, 60, 20, 50, 91, 75, 70, 65, 15, TRUE),
('이서포왕', 'SPT', 'KR', 53, 73, 68, 73, 58, 18, 48, 89, 73, 68, 63, 17, TRUE),
('박서포신', 'SPT', 'KR', 57, 77, 72, 77, 62, 22, 52, 93, 77, 72, 67, 13, TRUE),
('최서포호', 'SPT', 'KR', 51, 71, 66, 71, 56, 16, 46, 87, 71, 66, 61, 19, TRUE),
('정서포혁', 'SPT', 'KR', 56, 76, 71, 76, 61, 21, 51, 92, 76, 71, 66, 14, TRUE),
('강서포우', 'SPT', 'KR', 54, 74, 69, 74, 59, 19, 49, 90, 74, 69, 64, 16, TRUE),
('조서포민', 'SPT', 'KR', 58, 78, 73, 78, 63, 23, 53, 94, 78, 73, 68, 12, TRUE),
('윤서포석', 'SPT', 'KR', 52, 72, 67, 72, 57, 17, 47, 88, 72, 67, 62, 18, TRUE),
('장서포현', 'SPT', 'KR', 55, 75, 70, 75, 60, 20, 50, 91, 75, 70, 65, 15, TRUE),
('임서포수', 'SPT', 'KR', 59, 79, 74, 79, 64, 24, 54, 95, 79, 74, 69, 11, TRUE);

