#!/bin/bash

echo "=== Nginx 설정 파일 확인 ==="
echo ""
echo "현재 설정 파일 내용:"
sudo cat /etc/nginx/sites-available/berrple.com

echo ""
echo "=== SSL 설정이 있는지 확인 ==="
if sudo grep -q "listen.*ssl" /etc/nginx/sites-available/berrple.com; then
    echo "⚠️ SSL 설정이 발견되었습니다."
    echo ""
    echo "SSL 인증서 확인:"
    sudo ls -la /etc/letsencrypt/live/berrple.com/ 2>/dev/null || echo "❌ SSL 인증서 없음"
    echo ""
    echo "SSL 인증서가 없으면 HTTP만 사용하도록 설정을 수정해야 합니다."
else
    echo "✅ SSL 설정이 없습니다. HTTP만 사용 중입니다."
fi

