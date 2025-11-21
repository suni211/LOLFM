# WebSocket 연결 오류 최종 해결

## 문제
```
WebSocket connection to 'wss://berrple.com:3000/ws' failed
```

이 오류는 다음을 의미합니다:
- 잘못된 포트 (3000) 사용
- 잘못된 경로 (`/ws` 대신 `/socket.io` 사용)

## 해결 방법

### 1. 프론트엔드 .env 파일 확인 및 수정

GCP SSH에서:

```bash
cd ~/LOLFM/frontend
nano .env
```

다음 내용 확인:

```env
REACT_APP_API_URL=https://berrple.com/api
REACT_APP_SOCKET_URL=https://berrple.com
```

**중요**: 포트 번호를 포함하지 마세요!

### 2. 프론트엔드 재빌드 (프로덕션)

```bash
cd ~/LOLFM/frontend

# 의존성 확인
npm install

# 프로덕션 빌드
npm run build

# 빌드 확인
ls -la build/
```

### 3. 브라우저 캐시 삭제

브라우저에서:
- `Ctrl + Shift + Delete` (또는 `Cmd + Shift + Delete`)
- 캐시된 이미지 및 파일 삭제
- 또는 시크릿 모드로 테스트

### 4. Nginx 설정 확인

```bash
sudo nano /etc/nginx/sites-available/berrple.com
```

Socket.IO 설정이 올바른지 확인:

```nginx
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
```

### 5. Nginx 재시작

```bash
sudo nginx -t
sudo systemctl restart nginx
```

### 6. 백엔드 서버 확인

```bash
pm2 logs lolfm-backend
curl http://localhost:5000/api/health
```

## 확인 방법

브라우저 개발자 도구에서:

1. **Network 탭** 열기
2. **WS** 필터 선택
3. 연결이 `wss://berrple.com/socket.io/?EIO=4&transport=websocket` 형태여야 함
4. `wss://berrple.com:3000/ws` 오류가 사라져야 함

## 문제가 계속되면

### 옵션 1: 프론트엔드를 Nginx로 서빙 (프로덕션 빌드)

```bash


```

Nginx 설정에서:

```nginx
# 프론트엔드 (React 빌드 파일)
location / {
    root /home/ine158lovely/LOLFM/frontend/build;
    try_files $uri $uri/ /index.html;
    index index.html;
}
```

### 옵션 2: 개발 서버 포트 확인

개발 서버를 사용하는 경우:

```bash
# 프론트엔드 .env 확인
cat ~/LOLFM/frontend/.env

# PM2로 실행 중인 경우
pm2 restart lolfm-frontend
pm2 logs lolfm-frontend
```

## 체크리스트

- [ ] 프론트엔드 `.env` 파일에 올바른 URL 설정 (포트 없음)
- [ ] 프론트엔드 재빌드 완료
- [ ] 브라우저 캐시 삭제
- [ ] Nginx Socket.IO 설정 확인
- [ ] Nginx 재시작 완료
- [ ] 백엔드 서버 정상 작동 확인
- [ ] 브라우저 개발자 도구에서 올바른 WebSocket 연결 확인

