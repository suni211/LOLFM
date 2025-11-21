# GCP SSH에서 Nginx 설정 가이드 (berrple.com)

## 1. Nginx 설치

```bash
# 패키지 목록 업데이트
sudo apt update

# Nginx 설치
sudo apt install nginx -y

# Nginx 상태 확인
sudo systemctl status nginx

# Nginx 자동 시작 설정
sudo systemctl enable nginx
```

## 2. SSL 인증서 설정 (Let's Encrypt)

```bash
# Certbot 설치
sudo apt install certbot python3-certbot-nginx -y

# SSL 인증서 발급 (berrple.com)
sudo certbot --nginx -d berrple.com -d www.berrple.com

# 인증서 자동 갱신 테스트
sudo certbot renew --dry-run
```

## 3. Nginx 설정 파일 생성

```bash
# 기존 설정 백업
sudo cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup

# 새 설정 파일 생성
sudo nano /etc/nginx/sites-available/berrple.com
```

다음 내용 입력:

```nginx
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
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # 로그 설정
    access_log /var/log/nginx/berrple.com.access.log;
    error_log /var/log/nginx/berrple.com.error.log;

    # 최대 업로드 크기
    client_max_body_size 10M;

    # 프론트엔드 (React) - 루트 경로
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
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
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
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # 업로드된 파일 (로고 등)
    location /uploads {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
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
}
```

## 4. 설정 파일 활성화

```bash
# 심볼릭 링크 생성
sudo ln -s /etc/nginx/sites-available/berrple.com /etc/nginx/sites-enabled/

# 기본 설정 비활성화 (선택사항)
sudo rm /etc/nginx/sites-enabled/default

# Nginx 설정 테스트
sudo nginx -t

# Nginx 재시작
sudo systemctl restart nginx

# 상태 확인
sudo systemctl status nginx
```

## 5. 방화벽 설정 (GCP)

```bash
# GCP 콘솔에서 또는 gcloud 명령어로:
# HTTP (80) 포트 열기
gcloud compute firewall-rules create allow-http \
    --allow tcp:80 \
    --source-ranges 0.0.0.0/0 \
    --description "Allow HTTP traffic"

# HTTPS (443) 포트 열기
gcloud compute firewall-rules create allow-https \
    --allow tcp:443 \
    --source-ranges 0.0.0.0/0 \
    --description "Allow HTTPS traffic"
```

또는 GCP 콘솔에서:
1. **VPC 네트워크** > **방화벽 규칙**
2. **방화벽 규칙 만들기** 클릭
3. HTTP (80), HTTPS (443) 포트 허용

## 6. 백엔드 서버 실행 (PM2)

```bash
cd ~/LOLFM/backend

# PM2 설치 (아직 안 했다면)
sudo npm install -g pm2

# .env 파일 확인
cat .env

# 서버 실행
pm2 start server.js --name lolfm-backend

# 자동 시작 설정
pm2 startup
pm2 save

# 상태 확인
pm2 status
pm2 logs lolfm-backend
```

## 7. 프론트엔드 빌드 및 실행

### 옵션 1: PM2로 실행 (개발 모드)

```bash
cd ~/LOLFM/frontend

# 의존성 설치
npm install

# .env 파일 확인
cat .env

# 개발 서버 실행
pm2 start "npm start" --name lolfm-frontend

# 자동 시작 설정
pm2 save
```

### 옵션 2: 프로덕션 빌드 (권장)

```bash
cd ~/LOLFM/frontend

# 프로덕션 빌드
npm run build

# Nginx에서 정적 파일 서빙하도록 설정 변경
# /etc/nginx/sites-available/berrple.com 파일 수정
```

프론트엔드 location 블록을 다음과 같이 변경:

```nginx
# 프론트엔드 (React 빌드 파일)
location / {
    root /home/사용자명/LOLFM/frontend/build;
    try_files $uri $uri/ /index.html;
    index index.html;
}gi
```

그리고 Nginx 재시작:

```bash
sudo nginx -t
sudo systemctl restart nginx
```

## 8. Nginx 로그 확인

```bash
# 실시간 로그 확인
sudo tail -f /var/log/nginx/berrple.com.access.log
sudo tail -f /var/log/nginx/berrple.com.error.log

# 최근 에러 확인
sudo tail -n 100 /var/log/nginx/berrple.com.error.log
```

## 9. 문제 해결

### Nginx가 시작되지 않는 경우

```bash
# 설정 파일 문법 확인
sudo nginx -t

# 에러 로그 확인
sudo tail -f /var/log/nginx/error.log

# Nginx 상태 확인
sudo systemctl status nginx
```

### 백엔드 연결 오류

```bash
# 백엔드 서버가 실행 중인지 확인
pm2 status
curl http://localhost:5000/api/health

# 포트 확인
sudo netstat -tlnp | grep :5000
```

### 프론트엔드 연결 오류

```bash
# 프론트엔드 서버가 실행 중인지 확인
pm2 status
curl http://localhost:3000

# 포트 확인
sudo netstat -tlnp | grep :3000
```

### SSL 인증서 오류

```bash
# 인증서 상태 확인
sudo certbot certificates

# 인증서 수동 갱신
sudo certbot renew

# Nginx 재시작
sudo systemctl restart nginx
```

## 10. 최종 확인

```bash
# 1. Nginx 상태
sudo systemctl status nginx

# 2. PM2 상태
pm2 status

# 3. 포트 확인
sudo netstat -tlnp | grep -E ':(80|443|3000|5000)'

# 4. 웹사이트 접속 테스트
curl -I https://berrple.com
curl -I https://berrple.com/api/health
```

## 체크리스트

- [ ] Nginx 설치 완료
- [ ] SSL 인증서 발급 완료 (Let's Encrypt)
- [ ] Nginx 설정 파일 생성 완료
- [ ] 방화벽 규칙 설정 완료 (80, 443)
- [ ] 백엔드 서버 실행 완료 (PM2)
- [ ] 프론트엔드 빌드/실행 완료
- [ ] Nginx 재시작 완료
- [ ] 웹사이트 접속 테스트 완료
- [ ] Google OAuth 로그인 테스트 완료

## 추가 최적화

### Nginx 성능 최적화

`/etc/nginx/nginx.conf` 파일 수정:

```nginx
# worker_processes를 CPU 코어 수에 맞게 설정
worker_processes auto;

# 연결 수 증가
events {
    worker_connections 1024;
}

# Gzip 압축 활성화
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss;
```

수정 후:

```bash
sudo nginx -t
sudo systemctl restart nginx
```

