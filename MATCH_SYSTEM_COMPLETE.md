# 🎮 경기 시스템 완성 가이드

## ✅ 완료된 기능

### 1. 경기 시뮬레이션 시스템
- **BO3 방식**: 3게임 중 2승 먼저 달성한 팀 승리
- **팀 전력 계산**: 포지션별 가중치 적용
- **홈 어드밴티지**: 홈팀 전력 10% 보너스
- **컨디션 반영**: 선수 컨디션이 전력에 영향

### 2. 리그 순위 시스템
- **자동 업데이트**: 경기 결과 즉시 반영
- **순위 재계산**: 승점 → 득실차 → 다득점 순
- **시즌별 관리**: 연도별 순위 분리

### 3. 경기 관전 UI
- **실시간 시뮬레이션**: 경기 시작 버튼으로 시뮬레이션
- **결과 표시**: 승패 결과 및 스코어 표시
- **전력 비교**: 홈팀 vs 원정팀 전력 표시

### 4. 경기 일정 시스템
- **오늘의 경기**: Dashboard에 오늘 예정된 경기 표시
- **경기 클릭**: 경기 카드 클릭 시 관전 모달 열림
- **상태 표시**: 예정/진행중/완료 상태 표시

## 🚀 배포 방법

```bash
# GCP SSH에서

# 1. 데이터베이스 초기화
cd ~/LOLFM
mysql -u lolfm_user -p lolfm < backend/database/init_game.sql

# 2. 게임 시간 초기화 (2024년 11월)
mysql -u lolfm_user -p lolfm << EOF
INSERT INTO game_time (id, \`current_date\`, \`current_month\`, \`current_year\`, is_stove_league)
VALUES (1, '2024-11-01', 11, 2024, FALSE)
ON DUPLICATE KEY UPDATE 
  \`current_date\` = '2024-11-01',
  \`current_month\` = 11,
  \`current_year\` = 2024,
  is_stove_league = FALSE;
EOF

# 3. 모든 팀 자금 10억으로 설정
mysql -u lolfm_user -p lolfm << EOF
UPDATE teams SET money = 1000000000 WHERE money < 1000000000;
EOF

# 4. 백엔드 재시작
cd ~/LOLFM/backend
pm2 restart lolfm-backend

# 5. 프론트엔드 빌드 & 배포
cd ~/LOLFM/frontend
npm run build
sudo rm -rf /var/www/lolfm/*
sudo cp -r build/* /var/www/lolfm/

# 6. 로그 확인
pm2 logs lolfm-backend --lines 30
```

## 📋 주요 변경사항

### 백엔드
- ✅ `backend/services/matchService.js` - 완전히 재구현
- ✅ `backend/routes/matches.js` - 경기 라우트 완성
- ✅ `backend/routes/gameTime.js` - 2024년 11월 초기화
- ✅ `backend/routes/training.js` - 한 달에 한 번만 훈련
- ✅ `backend/routes/facilities.js` - 시설 업그레이드 수정
- ✅ `backend/routes/teams.js` - 초기 자금 10억

### 프론트엔드
- ✅ `frontend/src/components/MatchWatch.js` - 경기 관전 컴포넌트
- ✅ `frontend/src/components/MatchWatch.css` - 경기 관전 스타일
- ✅ `frontend/src/components/Dashboard.js` - 오늘의 경기 표시
- ✅ `frontend/src/components/Training.js` - 훈련 시스템 개선

## 🎯 경기 시스템 작동 방식

1. **경기 스케줄 생성**: 리그가 꽉 차면 자동으로 스케줄 생성
2. **경기 날짜**: 게임 시간에 따라 경기 날짜 결정
3. **경기 관전**: Dashboard에서 오늘의 경기 클릭 → 관전 모달 열림
4. **경기 시뮬레이션**: "경기 시작" 버튼 클릭 → BO3 시뮬레이션
5. **결과 저장**: 경기 결과 자동 저장 및 리그 순위 업데이트
6. **통계 반영**: 승리 시 명성 +5, 팬 +1000 / 패배 시 팬 -200

## ⚠️ 주의사항

- 경기는 한 번만 시뮬레이션 가능 (완료된 경기는 재시뮬레이션 불가)
- 리그 순위는 경기 완료 시 자동 업데이트
- 게임 시간은 6시간마다 1달 진행 (자동)
- 12월부터 스토브리그 시작

## 🔧 문제 해결

### 경기가 표시되지 않는 경우
1. 리그에 팀이 8팀(1부) 또는 10팀(2부)인지 확인
2. 스케줄이 생성되었는지 확인
3. 게임 시간이 올바른지 확인

### 경기 시뮬레이션이 안 되는 경우
1. 팀에 선수가 5명 이상인지 확인
2. 경기 상태가 'scheduled'인지 확인
3. 백엔드 로그 확인

