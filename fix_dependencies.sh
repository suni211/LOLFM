#!/bin/bash
# 의존성 설치 및 서버 재시작 스크립트

echo "=== 백엔드 의존성 설치 및 서버 재시작 ==="

# 1. PM2 프로세스 중지
echo "1. 기존 PM2 프로세스 중지 중..."
pm2 stop lolfm-backend 2>/dev/null
pm2 delete lolfm-backend 2>/dev/null

# 2. 백엔드 디렉토리로 이동
echo "2. 백엔드 디렉토리로 이동..."
cd ~/LOLFM/backend || exit 1

# 3. 의존성 설치
echo "3. 의존성 설치 중..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ 의존성 설치 실패"
    exit 1
fi

# 4. .env 파일 확인
echo "4. .env 파일 확인..."
if [ ! -f .env ]; then
    echo "⚠️  .env 파일이 없습니다. 생성해주세요."
else
    echo "✅ .env 파일 존재"
fi

# 5. 서버 수동 테스트 (선택사항)
echo "5. 서버 시작 테스트..."
timeout 3 node server.js 2>&1 | head -n 5 || true

# 6. PM2로 시작
echo "6. PM2로 서버 시작..."
pm2 start server.js --name lolfm-backend
pm2 save

# 7. 상태 확인
echo ""
echo "=== PM2 상태 ==="
pm2 status

echo ""
echo "=== 서버 로그 (최근 10줄) ==="
pm2 logs lolfm-backend --lines 10 --nostream

echo ""
echo "✅ 완료! 서버가 실행 중입니다."
echo "로그 확인: pm2 logs lolfm-backend"

