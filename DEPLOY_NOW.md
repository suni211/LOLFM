# 🚀 즉시 배포 가이드

## GCP SSH에서 실행할 명령어

```bash
# 1. 데이터베이스 마이그레이션
cd ~/LOLFM
mysql -u lolfm_user -p lolfm < backend/database/migrations/add_abbreviation_to_teams.sql
# 비밀번호 입력

# 2. Git Pull (최신 코드)
git pull origin main

# 3. 백엔드 재시작
cd ~/LOLFM/backend
pm2 restart lolfm-backend
pm2 logs lolfm-backend --lines 30

# 4. 프론트엔드 빌드 & 배포
cd ~/LOLFM/frontend
npm run build
sudo rm -rf /var/www/lolfm/*
sudo cp -r build/* /var/www/lolfm/

# 5. Nginx 재시작
sudo systemctl reload nginx

# 6. 확인
curl https://berrple.com
pm2 status
```

## 또는 Git 없이 직접 파일 수정

```bash
# DB 마이그레이션
mysql -u lolfm_user -p lolfm
# 비밀번호 입력 후:
ALTER TABLE teams ADD COLUMN abbreviation VARCHAR(10) AFTER name;
exit

# 백엔드 파일 수정
nano ~/LOLFM/backend/routes/teams.js
# POST / 라우트를 새 코드로 교체

# 재시작
cd ~/LOLFM/backend
pm2 restart lolfm-backend
```

