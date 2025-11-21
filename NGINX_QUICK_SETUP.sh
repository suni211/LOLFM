#!/bin/bash
# Nginx 빠른 설정 스크립트 (berrple.com)

echo "=== Nginx 설치 및 설정 시작 ==="

# 1. Nginx 설치
echo "1. Nginx 설치 중..."
sudo apt update
sudo apt install nginx -y
sudo systemctl enable nginx

# 2. Certbot 설치
echo "2. Certbot 설치 중..."
sudo apt install certbot python3-certbot-nginx -y

# 3. Nginx 설정 파일 생성
echo "3. Nginx 설정 파일 생성 중..."
sudo tee /etc/nginx/sites-available/berrple.com > /dev/null <<'EOF'
# HTTP에서 HTTPS로 리다이렉트
server {
    listen 80;
    listen [::]:80;
    server_name berrple.com www.berrple.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS 서버 설정
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name berrple.com www.berrple.com;

    # SSL 인증서 (Certbot이 자동으로 설정)
    ssl_certificate /etc/letsencrypt/live/berrple.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/berrple.com/privkey.pem;
    
    # SSL 보안 설정
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # 로그 설정
    access_log /var/log/nginx/berrple.com.access.log;
    error_log /var/log/nginx/berrple.com.error.log;

    # 최대 업로드 크기
    client_max_body_size 10M;

    # 프론트엔드 (React)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # 백엔드 API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # 업로드된 파일
    location /uploads {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Socket.IO
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
}
EOF

# 4. 설정 파일 활성화
echo "4. 설정 파일 활성화 중..."
sudo ln -sf /etc/nginx/sites-available/berrple.com /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# 5. Nginx 설정 테스트
echo "5. Nginx 설정 테스트 중..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Nginx 설정 파일이 올바릅니다."
    echo ""
    echo "다음 단계:"
    echo "1. SSL 인증서 발급: sudo certbot --nginx -d berrple.com -d www.berrple.com"
    echo "2. Nginx 재시작: sudo systemctl restart nginx"
    echo "3. 방화벽 규칙 설정 (GCP 콘솔에서 80, 443 포트 열기)"
else
    echo "❌ Nginx 설정 파일에 오류가 있습니다."
    exit 1
fi

