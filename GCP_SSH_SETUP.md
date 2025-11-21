# GCP SSH에서 직접 설정하기

## 1. SSH 접속

```bash
# Compute Engine 인스턴스에 SSH 접속
gcloud compute ssh INSTANCE_NAME --zone=ZONE

# 또는 GCP 콘솔에서 "SSH" 버튼 클릭
```

## 2. 시스템 업데이트 및 필수 패키지 설치

```bash
# 시스템 업데이트
sudo apt-get update
sudo apt-get upgrade -y

# 필수 패키지 설치
sudo apt-get install -y git curl build-essential
```

## 3. Node.js 설치

```bash
# Node.js 18.x 설치
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 버전 확인
node --version
npm --version
```

## 4. MariaDB 설치 및 설정

```bash
# MariaDB 설치
sudo apt-get install -y mariadb-server mariadb-client

# MariaDB 보안 설정
sudo mysql_secure_installation
# - root 비밀번호 설정
# - 익명 사용자 제거: Y
# - 원격 root 로그인 비활성화: Y
# - test 데이터베이스 제거: Y
# - 권한 테이블 다시 로드: Y
```

## 5. 데이터베이스 생성

```bash
# MariaDB 접속
sudo mysql -u root -p

# 데이터베이스 및 사용자 생성
CREATE DATABASE lolfm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'lolfm_user'@'localhost' IDENTIFIED BY 'YOUR_PASSWORD';
GRANT ALL PRIVILEGES ON lolfm.* TO 'lolfm_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

## 6. 프로젝트 클론

```bash
# 홈 디렉토리로 이동
cd ~

# GitHub에서 프로젝트 클론
git clone https://github.com/suni211/LOLFM.git
cd LOLFM
```

## 7. .env 파일 생성

```bash
# 백엔드 디렉토리로 이동
cd backend

# .env 파일 생성
nano .env
```

`.env` 파일 내용:

```env
# 데이터베이스 설정
DB_HOST=localhost
DB_PORT=3306
DB_USER=lolfm_user
DB_PASSWORD=YOUR_PASSWORD
DB_NAME=lolfm

# JWT 시크릿 키 (랜덤 문자열 생성)
JWT_SECRET=$(openssl rand -hex 32)

# 세션 시크릿 키 (랜덤 문자열 생성)
SESSION_SECRET=$(openssl rand -hex 32)

# 서버 포트
PORT=5000

# 프론트엔드 URL (GCP 외부 IP 또는 도메인)
FRONTEND_URL=http://YOUR_EXTERNAL_IP:3000

# 구글 OAuth 설정
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET
GOOGLE_CALLBACK_URL=http://YOUR_EXTERNAL_IP:5000/api/auth/google/callback
```

**Ctrl+X, Y, Enter**로 저장

## 8. 랜덤 시크릿 키 생성

```bash
# JWT 시크릿 생성
openssl rand -hex 32

# SESSION 시크릿 생성
openssl rand -hex 32

# 생성된 값을 .env 파일에 복사
```

## 9. 데이터베이스 스키마 적용

```bash
# 프로젝트 루트로 이동
cd ~/LOLFM

# 스키마 적용
mysql -u lolfm_user -p lolfm < backend/database/schema.sql

# 마이그레이션 적용 (로고 컬럼 추가)
mysql -u lolfm_user -p lolfm < backend/database/migrations/add_logo_to_teams.sql
```

## 10. 백엔드 의존성 설치 및 실행

```bash
# 백엔드 디렉토리로 이동
cd ~/LOLFM/backend

# 의존성 설치
npm install

# 업로드 디렉토리 생성
mkdir -p public/uploads/logos

# 서버 실행 (테스트)
npm start

# 또는 개발 모드 (nodemon 필요)
npm install -g nodemon
npm run dev
```

## 11. 프론트엔드 의존성 설치 및 빌드

```bash
# 새 터미널 또는 백그라운드 실행 후
cd ~/LOLFM/frontend

# 의존성 설치
npm install

# 프로덕션 빌드
npm run build

# 또는 개발 서버 실행
npm start
```

## 12. PM2로 프로세스 관리 (권장)

```bash
# PM2 설치
sudo npm install -g pm2

# 백엔드 실행
cd ~/LOLFM/backend
pm2 start server.js --name lolfm-backend

# 프론트엔드 실행 (빌드 후)
cd ~/LOLFM/frontend
pm2 serve build 3000 --name lolfm-frontend --spa

# PM2 상태 확인
pm2 status

# 로그 확인
pm2 logs

# 자동 시작 설정
pm2 startup
pm2 save
```

## 13. 방화벽 설정 (GCP)

```bash
# GCP 콘솔에서 또는 gcloud 명령어로
# VPC 네트워크 → 방화벽 규칙 → 방화벽 규칙 만들기

# HTTP 트래픽 허용
gcloud compute firewall-rules create allow-http \
  --allow tcp:80 \
  --source-ranges 0.0.0.0/0 \
  --description "Allow HTTP"

# HTTPS 트래픽 허용
gcloud compute firewall-rules create allow-https \
  --allow tcp:443 \
  --source-ranges 0.0.0.0/0 \
  --description "Allow HTTPS"

# 백엔드 포트 허용 (5000)
gcloud compute firewall-rules create allow-backend \
  --allow tcp:5000 \
  --source-ranges 0.0.0.0/0 \
  --description "Allow Backend"

# 프론트엔드 포트 허용 (3000)
gcloud compute firewall-rules create allow-frontend \
  --allow tcp:3000 \
  --source-ranges 0.0.0.0/0 \
  --description "Allow Frontend"
```

## 14. Nginx 리버스 프록시 설정 (선택사항, 권장)

```bash
# Nginx 설치
sudo apt-get install -y nginx

# 설정 파일 생성
sudo nano /etc/nginx/sites-available/lolfm
```

Nginx 설정 내용:

```nginx
# 백엔드 프록시
server {
    listen 80;
    server_name YOUR_DOMAIN_OR_IP;

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # 프론트엔드
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # 업로드된 파일 서빙
    location /uploads {
        alias /home/YOUR_USERNAME/LOLFM/backend/public/uploads;
    }
}
```

```bash
# 심볼릭 링크 생성
sudo ln -s /etc/nginx/sites-available/lolfm /etc/nginx/sites-enabled/

# 설정 테스트
sudo nginx -t

# Nginx 재시작
sudo systemctl restart nginx

# 자동 시작 설정
sudo systemctl enable nginx
```

## 15. SSL 인증서 설정 (Let's Encrypt, 선택사항)

```bash
# Certbot 설치
sudo apt-get install -y certbot python3-certbot-nginx

# SSL 인증서 발급 (도메인이 있는 경우)
sudo certbot --nginx -d your-domain.com

# 자동 갱신 설정
sudo certbot renew --dry-run
```

## 16. MariaDB 원격 접속 허용 (필요한 경우)

```bash
# MariaDB 설정 파일 수정
sudo nano /etc/mysql/mariadb.conf.d/50-server.cnf

# bind-address를 0.0.0.0으로 변경
# bind-address = 0.0.0.0

# MariaDB 재시작
sudo systemctl restart mariadb

# 방화벽에서 3306 포트 허용 (보안 주의!)
# GCP 방화벽 규칙에서만 특정 IP 허용하는 것을 권장
```

## 17. 체크리스트

- [ ] Node.js 설치 완료
- [ ] MariaDB 설치 및 설정 완료
- [ ] 데이터베이스 및 사용자 생성 완료
- [ ] 프로젝트 클론 완료
- [ ] .env 파일 생성 및 설정 완료
- [ ] 스키마 적용 완료
- [ ] 백엔드 의존성 설치 완료
- [ ] 프론트엔드 의존성 설치 완료
- [ ] PM2로 프로세스 실행 완료
- [ ] 방화벽 규칙 설정 완료
- [ ] Nginx 설정 완료 (선택사항)
- [ ] 서비스 테스트 완료

## 18. 유용한 명령어

```bash
# PM2 관리
pm2 list              # 프로세스 목록
pm2 logs              # 로그 확인
pm2 restart all       # 모든 프로세스 재시작
pm2 stop all          # 모든 프로세스 중지
pm2 delete all        # 모든 프로세스 삭제

# MariaDB 관리
sudo systemctl status mariadb    # 상태 확인
sudo systemctl restart mariadb   # 재시작
sudo systemctl stop mariadb      # 중지

# Nginx 관리
sudo systemctl status nginx      # 상태 확인
sudo systemctl restart nginx     # 재시작
sudo nginx -t                    # 설정 테스트

# 로그 확인
pm2 logs lolfm-backend           # 백엔드 로그
pm2 logs lolfm-frontend          # 프론트엔드 로그
tail -f /var/log/nginx/error.log # Nginx 에러 로그
```

## 19. 문제 해결

### 포트가 이미 사용 중인 경우
```bash
# 포트 사용 중인 프로세스 확인
sudo lsof -i :5000
sudo lsof -i :3000

# 프로세스 종료
sudo kill -9 PID
```

### MariaDB 연결 오류
```bash
# MariaDB 상태 확인
sudo systemctl status mariadb

# 연결 테스트
mysql -u lolfm_user -p lolfm
```

### 권한 오류
```bash
# 업로드 디렉토리 권한 설정
sudo chmod -R 755 ~/LOLFM/backend/public/uploads
sudo chown -R $USER:$USER ~/LOLFM/backend/public/uploads
```

## 20. 프로덕션 환경 변수 확인

```bash
# .env 파일 확인 (비밀번호 노출 주의!)
cat ~/LOLFM/backend/.env

# 환경 변수 테스트
cd ~/LOLFM/backend
node -e "require('dotenv').config(); console.log(process.env.DB_HOST)"
```

