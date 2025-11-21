# 프론트엔드가 안 뜨는 문제 해결

## 즉시 확인할 사항

### 1. Nginx 상태 확인

```bash
# Nginx 실행 상태 확인
sudo systemctl status nginx

# Nginx가 실행 중이 아니면 시작
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 2. 빌드 파일 확인

```bash
cd ~/LOLFM/frontend

# 빌드 파일이 있는지 확인
ls -la build/

# 빌드 파일이 없거나 오래되었으면 재빌드
rm -rf build
npm run build

# 빌드 확인
ls -la build/static/js/ | head -5
```

### 3. Nginx 설정 확인

```bash
# Nginx 설정 파일 확인
sudo cat /etc/nginx/sites-available/berrple.com

# 또는
sudo nano /etc/nginx/sites-available/berrple.com
```

**확인 사항:**
- `root /home/ine158lovely/LOLFM/frontend/build;` 있어야 함
- `index index.html;` 있어야 함
- `location /` 블록이 있어야 함

**올바른 설정 예시:**
```nginx
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
```

### 4. Nginx 로그 확인

```bash
# 에러 로그 확인
sudo tail -50 /var/log/nginx/error.log

# 액세스 로그 확인
sudo tail -50 /var/log/nginx/access.log
```

### 5. 파일 권한 확인

```bash
# 빌드 파일 권한 확인
ls -la ~/LOLFM/frontend/build/

# Nginx가 읽을 수 있도록 권한 설정
chmod -R 755 ~/LOLFM/frontend/build
chown -R ine158lovely:ine158lovely ~/LOLFM/frontend/build
```

### 6. 포트 확인

```bash
# 포트 80이 열려있는지 확인
sudo netstat -tlnp | grep :80

# 또는
sudo ss -tlnp | grep :80
```

### 7. 방화벽 확인

```bash
# UFW 방화벽 상태 확인
sudo ufw status

# 포트 80이 열려있어야 함
# 필요시 포트 열기
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

## 단계별 해결 방법

### Step 1: 기본 확인

```bash
# 1. Nginx 실행 중인지 확인
sudo systemctl status nginx

# 2. 빌드 파일 확인
ls -la ~/LOLFM/frontend/build/index.html

# 3. Nginx 설정 테스트
sudo nginx -t
```

### Step 2: 빌드 재생성

```bash
cd ~/LOLFM/frontend

# 캐시 삭제
rm -rf node_modules/.cache
rm -rf build

# 재빌드
npm run build

# 빌드 확인
ls -la build/
cat build/index.html | head -20
```

### Step 3: Nginx 설정 수정

```bash
sudo nano /etc/nginx/sites-available/berrple.com
```

**최소 설정:**
```nginx
server {
    listen 80;
    server_name berrple.com www.berrple.com;

    root /home/ine158lovely/LOLFM/frontend/build;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### Step 4: Nginx 재시작

```bash
# 설정 테스트
sudo nginx -t

# 재시작
sudo systemctl restart nginx

# 상태 확인
sudo systemctl status nginx
```

### Step 5: 로컬에서 테스트

```bash
# 로컬에서 직접 테스트
cd ~/LOLFM/frontend/build
python3 -m http.server 8080

# 또는
npx serve -s build -l 8080
```

브라우저에서 `http://localhost:8080` 접속하여 빌드 파일이 정상인지 확인

## 브라우저에서 확인

1. **시크릿 모드**로 열기 (캐시 무시)
2. 개발자 도구 > Network 탭
3. 페이지 새로고침
4. 확인:
   - `index.html` 파일이 로드되는지
   - JavaScript 파일이 로드되는지
   - 에러 메시지가 있는지

## 일반적인 오류

### 403 Forbidden
```bash
# 파일 권한 문제
chmod -R 755 ~/LOLFM/frontend/build
```

### 404 Not Found
```bash
# 빌드 파일이 없거나 경로가 잘못됨
ls -la ~/LOLFM/frontend/build/
# Nginx 설정에서 root 경로 확인
```

### 502 Bad Gateway
```bash
# Nginx 설정 오류
sudo nginx -t
sudo tail -50 /var/log/nginx/error.log
```

## 빠른 진단 스크립트

```bash
#!/bin/bash

echo "=== Nginx 상태 ==="
sudo systemctl status nginx --no-pager | head -10

echo ""
echo "=== 빌드 파일 확인 ==="
ls -la ~/LOLFM/frontend/build/ 2>/dev/null || echo "❌ 빌드 파일 없음"

echo ""
echo "=== Nginx 설정 테스트 ==="
sudo nginx -t

echo ""
echo "=== 최근 Nginx 에러 로그 ==="
sudo tail -20 /var/log/nginx/error.log

echo ""
echo "=== 포트 80 확인 ==="
sudo netstat -tlnp | grep :80 || echo "❌ 포트 80이 열려있지 않음"
```

## 최종 체크리스트

- [ ] Nginx가 실행 중임 (`sudo systemctl status nginx`)
- [ ] 빌드 파일이 존재함 (`ls -la ~/LOLFM/frontend/build/`)
- [ ] Nginx 설정이 올바름 (`sudo nginx -t`)
- [ ] 파일 권한이 올바름 (`chmod -R 755 build`)
- [ ] 포트 80이 열려있음 (`sudo netstat -tlnp | grep :80`)
- [ ] 방화벽이 포트 80을 허용함 (`sudo ufw status`)

