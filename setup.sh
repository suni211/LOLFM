#!/bin/bash
# GCP SSH에서 실행할 자동 설정 스크립트

echo "=== LOLFM 자동 설정 시작 ==="

# 1. 시스템 업데이트
echo "시스템 업데이트 중..."
sudo apt-get update
sudo apt-get upgrade -y

# 2. 필수 패키지 설치
echo "필수 패키지 설치 중..."
sudo apt-get install -y git curl build-essential

# 3. Node.js 설치
echo "Node.js 설치 중..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 4. MariaDB 설치
echo "MariaDB 설치 중..."
sudo apt-get install -y mariadb-server mariadb-client

# 5. PM2 설치
echo "PM2 설치 중..."
sudo npm install -g pm2

# 6. 프로젝트 클론
echo "프로젝트 클론 중..."
cd ~
if [ -d "LOLFM" ]; then
    echo "LOLFM 디렉토리가 이미 존재합니다. 업데이트합니다..."
    cd LOLFM
    git pull
else
    git clone https://github.com/suni211/LOLFM.git
    cd LOLFM
fi

# 7. 업로드 디렉토리 생성
echo "업로드 디렉토리 생성 중..."
mkdir -p backend/public/uploads/logos

# 8. 백엔드 의존성 설치
echo "백엔드 의존성 설치 중..."
cd backend
npm install

# 9. 프론트엔드 의존성 설치
echo "프론트엔드 의존성 설치 중..."
cd ../frontend
npm install

# 10. .env 파일 확인
echo "=== .env 파일 설정 필요 ==="
echo "backend/.env 파일을 생성하고 다음 정보를 입력하세요:"
echo "- DB_HOST=localhost"
echo "- DB_PORT=3306"
echo "- DB_USER=lolfm_user"
echo "- DB_PASSWORD=(설정한 비밀번호)"
echo "- DB_NAME=lolfm"
echo "- JWT_SECRET, SESSION_SECRET (openssl rand -hex 32로 생성)"
echo "- GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET"
echo ""
echo "설정이 완료되면 다음 명령어를 실행하세요:"
echo "1. mysql -u root -p < backend/database/schema.sql"
echo "2. pm2 start backend/server.js --name lolfm-backend"
echo "3. pm2 start 'npm start' --name lolfm-frontend --cwd frontend"

echo "=== 자동 설정 완료 ==="

