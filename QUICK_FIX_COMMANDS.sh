#!/bin/bash

# Nginx SSL 설정 오류 해결 스크립트

echo "=== Nginx 설정 확인 ==="
echo "현재 Nginx 설정 파일을 확인합니다..."

# SSL 인증서 확인
if [ -d "/etc/letsencrypt/live/berrple.com" ]; then
    echo "✅ SSL 인증서가 있습니다."
    SSL_AVAILABLE=true
else
    echo "⚠️ SSL 인증서가 없습니다. HTTP만 사용합니다."
    SSL_AVAILABLE=false
fi

echo ""
echo "=== Nginx 설정 파일 수정 ==="
echo "sudo nano /etc/nginx/sites-available/berrple.com"
echo ""
echo "SSL 인증서가 없는 경우 다음 설정을 사용하세요:"
echo ""
cat << 'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name berrple.com www.berrple.com;

    root /home/ine158lovely/LOLFM/frontend/build;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /socket.io {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

echo ""
echo "=== 백엔드 서버 재시작 ==="
echo "pm2 restart lolfm-backend"

