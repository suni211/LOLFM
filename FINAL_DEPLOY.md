# 🎮 최종 배포 가이드

## ✅ 완성된 모든 기능
1. **실제 프로 선수 데이터** - 170명 이상
2. **포텐셜 등급 시스템** - 1~5등급 (80-99)
3. **나이별 성장 시스템** - 15-19세 최고 성장, 20세+ 거의 안됨
4. **선수 선택 시스템** - 포지션별 2명 중 1명 선택
5. **경기 시뮬레이션**
6. **리그 스케줄 자동 생성**
7. **훈련 시스템**
8. **재정 시스템**
9. **스폰서 시스템**

---

## 🚀 GCP SSH 배포 명령어

```bash
# 1. DB 초기화
cd ~/LOLFM
mysql -u lolfm_user -p lolfm << EOF
ALTER TABLE teams ADD COLUMN IF NOT EXISTS abbreviation VARCHAR(10) AFTER name;
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE players;
SET FOREIGN_KEY_CHECKS = 1;
EOF

# 2. 실제 선수 데이터 삽입
mysql -u lolfm_user -p lolfm < backend/database/seed_players_real.sql
mysql -u lolfm_user -p lolfm < backend/database/seed_players_international.sql

# 3. Git Pull
git pull origin main

# 4. 백엔드 재시작
w
pm2 logs lolfm-backend --lines 50

# 5. 프론트엔드 빌드 & 배포
cd ~/LOLFM/frontend
npm install
npm run build
sudo rm -rf /var/www/lolfm/*
sudo cp -r build/* /var/www/lolfm/

# 6. Nginx 재시작
sudo systemctl reload nginx

# 7. 확인
pm2 status
curl https://berrple.com
```

---g

## 🎯 선수 시스템 세부사항

### 포텐셜 등급 (Potential Tiers)
- **1등급**: 80-85 (평범)
- **2등급**: 86-90 (좋음)
- **3등급**: 91-93 (훌륭함)
- **4등급**: 94-96 (뛰어남)
- **5등급**: 97-99 (전설)

### 나이별 성장률
- **15-16세**: 최고 성장률 (포텐셜 90+)
- **17-19세**: 높은 성장률
- **20-22세**: 풀 오버롤 또는 낮은 포텐셜
- **23세+**: 성장 거의 없음

### 실제 선수 예시
- **Faker (22세)**: Overall 90, Potential 91 (거의 완성)
- **Canyon (18세)**: Overall 85, Potential 97 (성장 가능)
- **Chovy (18세)**: Overall 88, Potential 98 (최고 포텐셜)
- **DDahyuk (15세)**: Overall 55, Potential 95 (미래의 스타)

---

## 📋 플레이 흐름

1. **로그인** → Google OAuth
2. **팀 생성** → 지역 선택 → 리그 선택 → 팀 정보 입력
3. **선수 선택** (5단계)
   - TOP: 2명 중 1명
   - JGL: 2명 중 1명
   - MID: 2명 중 1명
   - ADC: 2명 중 1명
   - SPT: 2명 중 1명
4. **시즌 시작** → 자동 리그 스케줄 생성
5. **팀 운영**:
   - 선수 훈련 (능력치 향상)
   - 시설 업그레이드
   - 스폰서 계약
   - 재정 관리
6. **경기 진행** → 자동 시뮬레이션
7. **월별 정산** → 수입/지출 처리

---

## 🌟 주요 선수 목록

### 한국 TOP 선수
- Kiin (18세, Pot 94) - Overall 75
- Zeus (18세, Pot 96) - Overall 78

### 한국 정글 선수
- Canyon (18세, Pot 97) - Overall 85 ⭐
- Kanavi (19세, Pot 93) - Overall 83
- Oner (17세, Pot 94) - Overall 79

### 한국 미드 선수
- Chovy (18세, Pot 98) - Overall 88 ⭐⭐
- ShowMaker (19세, Pot 94) - Overall 85
- Faker (22세, Pot 91) - Overall 90 ⭐

### 해외 선수
- Caps (17세, DEN, Pot 96) - Overall 80 ⭐
- BrokenBlade (18세, GER, Pot 90) - Overall 74
- CoreJJ (21세, KOR, Pot 83) - Overall 79

---

## ✨ 모든 시스템 완성!

배포만 하면 바로 플레이 가능합니다! 🎉

**170명 이상의 실제 프로 선수**와 함께 당신만의 e스포츠 제국을 건설하세요!

