# WebSocket 연결 오류 본질적 원인 분석

## 문제
```
WebSocket connection to 'wss://berrple.com:3000/ws' failed
```

## 본질적 원인

### 1. webpack-dev-server의 HMR WebSocket
- **`wss://berrple.com:3000/ws`**는 **webpack-dev-server**의 **HMR (Hot Module Replacement)** WebSocket입니다
- React 개발 서버(`npm start`)가 실행 중일 때만 발생합니다
- 프로덕션 빌드(`npm run build`)에서는 **절대 발생하지 않습니다**

### 2. 왜 이런 일이 발생하는가?

#### 개발 모드 (`npm start`)
```
webpack-dev-server → 포트 3000 → /ws 경로로 HMR WebSocket
```

#### 프로덕션 모드 (`npm run build`)
```
Nginx → 빌드된 정적 파일 서빙 → Socket.IO는 별도로 연결
```

### 3. 현재 상황 분석

**가능한 시나리오:**

1. **개발 서버가 실행 중**
   ```bash
   # GCP에서 확인
   ps aux | grep "react-scripts\|webpack-dev-server"
   pm2 list
   ```

2. **브라우저가 개발 서버에 연결 시도**
   - 브라우저가 `berrple.com:3000`으로 직접 연결을 시도
   - 하지만 프로덕션 환경에서는 포트 3000이 열려있지 않음

3. **빌드된 파일이 오래됨**
   - 이전 빌드에 개발 서버 코드가 포함되어 있을 수 있음

## 해결 방법

### ✅ 올바른 해결책

#### 1. 개발 서버 완전 중지 (GCP SSH)
```bash
# 모든 Node 프로세스 확인
ps aux | grep node

# 개발 서버가 실행 중이면 종료
pkill -f "react-scripts"
pkill -f "webpack-dev-server"

# PM2에서도 확인
pm2 list
pm2 stop all  # 필요시
pm2 delete all  # 필요시
```

#### 2. 프로덕션 빌드만 사용
```bash
cd ~/LOLFM/frontend

# 개발 서버 종료 확인
# (이미 종료되어 있어야 함)

# 빌드 디렉토리 확인
ls -la build/

# 빌드가 없거나 오래되었으면 재빌드
rm -rf build
npm run build

# 빌드 확인
ls -la build/static/js/ | head -5
```

#### 3. Nginx가 빌드된 파일만 서빙하는지 확인
```bash
sudo nano /etc/nginx/sites-available/berrple.com
```

**올바른 설정:**
```nginx
server {
    listen 80;
    listen [::]:80;
    server_name berrple.com www.berrple.com;

    # SSL 리다이렉트 (Let's Encrypt 설정 후)
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name berrple.com www.berrple.com;

    # SSL 인증서 설정
    ssl_certificate /etc/letsencrypt/live/berrple.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/berrple.com/privkey.pem;

    # 정적 파일 서빙 (프로덕션 빌드)
    root /home/ine158lovely/LOLFM/frontend/build;
    index index.html;

    # React Router를 위한 설정
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Socket.IO (WebSocket) - 백엔드로 프록시
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

**잘못된 설정 (개발 서버 프록시):**
```nginx
# ❌ 이렇게 하면 안 됩니다!
location / {
    proxy_pass http://localhost:3000;  # 개발 서버
}
```

#### 4. Nginx 재시작
```bash
sudo nginx -t
sudo systemctl restart nginx
```

#### 5. 브라우저 캐시 완전 삭제
- `Ctrl + Shift + Delete` (Windows) 또는 `Cmd + Shift + Delete` (Mac)
- **모든 시간** 선택
- **캐시된 이미지 및 파일** 체크
- 삭제 후 **시크릿 모드**로 테스트

## 확인 방법

### ✅ 올바른 WebSocket 연결
브라우저 개발자 도구 > Network 탭 > WS 필터:
```
wss://berrple.com/socket.io/?EIO=4&transport=websocket
```

### ❌ 잘못된 WebSocket 연결 (개발 서버)
```
wss://berrple.com:3000/ws  ← 이것은 개발 서버 HMR
```

## 핵심 정리

1. **`wss://berrple.com:3000/ws`는 개발 서버의 HMR WebSocket입니다**
2. **프로덕션에서는 개발 서버를 실행하지 않아야 합니다**
3. **Nginx는 빌드된 정적 파일만 서빙해야 합니다**
4. **Socket.IO는 별도로 `/socket.io` 경로로 연결됩니다**

## 최종 체크리스트

- [ ] 개발 서버가 실행 중이지 않음 (`ps aux | grep react-scripts`)
- [ ] 프로덕션 빌드가 최신임 (`ls -la build/`)
- [ ] Nginx가 빌드된 파일을 서빙함 (`root /home/ine158lovely/LOLFM/frontend/build`)
- [ ] Nginx가 개발 서버로 프록시하지 않음
- [ ] 브라우저 캐시 삭제 완료
- [ ] 시크릿 모드로 테스트 완료

