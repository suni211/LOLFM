# WebSocket 연결 오류 해결 가이드

## 문제
```
WebSocket connection to 'wss://berrple.com:3000/ws' failed
```

## 원인
- 잘못된 포트 번호 (3000) 사용
- 잘못된 경로 (`/ws` 대신 `/socket.io` 사용)
- 환경 변수가 빌드 시점에 반영되지 않음

## 해결 방법

### 1. 프론트엔드 재빌드 (필수)

GCP SSH에서:

```bash
cd ~/LOLFM/frontend

# 환경 변수 확인
cat .env

# .env 파일이 없으면 생성
nano .env
```

`.env` 파일 내용:
```env
REACT_APP_API_URL=https://berrple.com/api
REACT_APP_SOCKET_URL=https://berrple.com
```

**중요**: 포트 번호를 포함하지 마세요!

```bash
# 의존성 설치
npm install

# 프로덕션 빌드
npm run build

# 빌드 확인
ls -la build/
```

### 2. Nginx 설정 확인

```bash
sudo nano /etc/nginx/sites-available/berrple.com
```

Socket.IO 설정 확인:
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

### 3. Nginx 재시작

```bash
sudo nginx -t
sudo systemctl restart nginx
```

### 4. 브라우저 캐시 삭제

1. `Ctrl + Shift + Delete` (또는 `Cmd + Shift + Delete`)
2. 캐시된 이미지 및 파일 삭제
3. 또는 시크릿 모드로 테스트

### 5. 확인

브라우저 개발자 도구 > Network 탭 > WS 필터:

- ✅ 올바른 연결: `wss://berrple.com/socket.io/?EIO=4&transport=websocket`
- ❌ 잘못된 연결: `wss://berrple.com:3000/ws`

## 코드 수정 사항

`socket.js` 파일이 수정되어:
- 프로덕션 환경 자동 감지
- 포트 번호 자동 제거
- 프로토콜 자동 변환 (http → https)

## 문제가 계속되면

1. **백엔드 서버 확인**
   ```bash
   pm2 logs lolfm-backend
   curl http://localhost:5000/api/health
   ```

2. **프론트엔드 빌드 파일 확인**
   ```bash
   cd ~/LOLFM/frontend/build
   grep -r "3000" static/js/
   ```

3. **Nginx 로그 확인**
   ```bash
   sudo tail -f /var/log/nginx/error.log
   ```

