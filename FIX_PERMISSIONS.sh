#!/bin/bash

echo "=== 파일 권한 수정 ==="

# 빌드 디렉토리 권한 설정
echo "빌드 디렉토리 권한 설정 중..."
chmod -R 755 ~/LOLFM/frontend/build
chmod -R 755 ~/LOLFM/frontend

# Nginx가 읽을 수 있도록 상위 디렉토리 권한도 확인
echo "상위 디렉토리 권한 확인 중..."
chmod 755 ~/LOLFM
chmod 755 ~/LOLFM/frontend

# 파일 소유자 확인
echo ""
echo "=== 파일 소유자 확인 ==="
ls -la ~/LOLFM/frontend/build/ | head -5

# Nginx 사용자 확인
echo ""
echo "=== Nginx 사용자 확인 ==="
ps aux | grep nginx | head -2

# 권한 테스트
echo ""
echo "=== 권한 테스트 ==="
sudo -u www-data test -r ~/LOLFM/frontend/build/index.html && echo "✅ Nginx가 파일을 읽을 수 있습니다" || echo "❌ Nginx가 파일을 읽을 수 없습니다"

