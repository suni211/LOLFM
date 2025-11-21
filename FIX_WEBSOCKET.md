# WebSocket 연결 오류 해결

## 문제
```
WebSocket connection to 'wss://berrple.com:3000/ws' failed
```

## 원인
1. Socket.IO URL이 잘못 설정됨
2. 포트 3000을 사용하려고 시도 (프론트엔드 포트)
3. 실제로는 백엔드(포트 5000) 또는 Nginx 프록시를 통해 연결해야 함

## 해결 방법

### 1. 프론트엔드 .env 파일 확인

```bash
cd ~/LOLFM/frontend
nano .env
```

다음 내용 확인:

```env
REACT_APP_API_URL=https://berrple.com/api
REACT_APP_SOCKET_URL=https://berrple.com
```

### 2. Socket.IO 설정 수정 완료

`frontend/src/services/socket.js` 파일이 수정되었습니다:
- 환경 변수에서 Socket URL 가져오기
- 올바른 경로 설정 (`/socket.io`)
- 재연결 옵션 추가

### 3. Nginx 설정 확인

Nginx에서 Socket.IO 프록시가 올바르게 설정되어 있는지 확인:

```bash
sudo nano /etc/nginx/sites-available/berrple.com
```

다음 블록이 있어야 합니다:

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

### 4. 프론트엔드 재빌드 및 재시작

```bash
cd ~/LOLFM/frontend

# 프로덕션 빌드
npm run build

# 또는 개발 서버 재시작
pm2 restart lolfm-frontend
```

### 5. Nginx 재시작

```bash
sudo nginx -t
sudo systemctl restart nginx
```

## 확인

1. 브라우저 개발자 도구 > Network 탭
2. WebSocket 연결 확인
3. `wss://berrple.com/socket.io/?EIO=4&transport=websocket` 형태로 연결되어야 함

## 문제 해결

### 여전히 연결이 안 되는 경우

1. **백엔드 서버 확인**
   ```bash
   pm2 logs lolfm-backend
   curl http://localhost:5000/api/health
   ```

2. **Nginx 로그 확인**
   ```bash
   sudo tail -f /var/log/nginx/berrple.com.error.log
   ```

3. **방화벽 확인**
   - GCP 콘솔에서 포트 443 (HTTPS)이 열려있는지 확인

4. **Socket.IO 버전 확인**
   - 백엔드와 프론트엔드의 socket.io 버전이 호환되는지 확인

