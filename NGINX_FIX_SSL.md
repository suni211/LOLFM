# Nginx SSL 설정 오류 해결

## 오류
```
nginx: [emerg] no "ssl_certificate" is defined for the "listen ... ssl" directive
```

## 원인
Nginx 설정 파일에서 `listen 443 ssl`을 사용했지만 SSL 인증서 경로가 정의되지 않았습니다.

## 해결 방법

### 옵션 1: SSL 인증서가 없는 경우 (HTTP만 사용)

```bash
sudo nano /etc/nginx/sites-available/berrple.com
```

**HTTP만 사용하는 설정:**
```nginx
server {
    listen 80;
    listen [::]:80;
    server_name berrple.com www.berrple.com;

    # 프로덕션 빌드 서빙
    root /home/ine158lovely/LOLFM/frontend/build;
    index index.html;

    # React Router
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Socket.IO (WebSocket)
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

    # API 프록시
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 옵션 2: SSL 인증서가 있는 경우

```bash
# SSL 인증서 확인
sudo ls -la /etc/letsencrypt/live/berrple.com/

# 인증서가 있으면:
sudo nano /etc/nginx/sites-available/berrple.com
```

**SSL 설정 포함:**
```nginx
# HTTP를 HTTPS로 리다이렉트
server {
    listen 80;
    listen [::]:80;
    server_name berrple.com www.berrple.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS 서버
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name berrple.com www.berrple.com;

    # SSL 인증서
    ssl_certificate /etc/letsencrypt/live/berrple.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/berrple.com/privkey.pem;

    # SSL 설정
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # 프로덕션 빌드 서빙
    root /home/ine158lovely/LOLFM/frontend/build;
    index index.html;

    # React Router
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Socket.IO (WebSocket)
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

    # API 프록시
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 옵션 3: SSL 인증서 설치 (Let's Encrypt)

```bash
# Certbot 설치
sudo apt update
sudo apt install certbot python3-certbot-nginx

# SSL 인증서 발급
sudo certbot --nginx -d berrple.com -d www.berrple.com

# 자동 갱신 설정
sudo certbot renew --dry-run
```

## 적용

```bash
# 설정 테스트
sudo nginx -t

# Nginx 재시작
sudo systemctl restart nginx

# 상태 확인
sudo systemctl status nginx
```

