# 최종 수정 단계

## 현재 상태
- ✅ PM2에서 lolfm-frontend 삭제 완료
- ✅ 프로덕션 빌드 완료
- ⚠️ 개발 서버 프로세스가 여전히 실행 중

## 남은 작업

### 1. 개발 서버 프로세스 완전 종료

```bash
# 프로세스 ID 확인
ps aux | grep "react-scripts\|webpack-dev-server"

# 프로세스 강제 종료
kill -9 259040 259041 259048

# 또는 모든 react-scripts 프로세스 종료
pkill -9 -f "react-scripts"
pkill -9 -f "webpack-dev-server"

# 확인
ps aux | grep "react-scripts\|webpack-dev-server"
# 아무것도 나오지 않아야 함
```

### 2. Nginx 설정 확인

```bash
sudo nano /etc/nginx/sites-available/berrple.com
```

**확인 사항:**
- `root /home/ine158lovely/LOLFM/frontend/build;` 있어야 함
- `proxy_pass http://localhost:3000;` 있으면 제거해야 함
- `/socket.io` 경로가 `http://localhost:5000`으로 프록시되어야 함

**올바른 설정 예시:**
```nginx
server {
    listen 443 ssl http2;
    server_name berrple.com www.berrple.com;

    # SSL 인증서
    ssl_certificate /etc/letsencrypt/live/berrple.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/berrple.com/privkey.pem;

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

### 3. Nginx 재시작

```bash
sudo nginx -t
sudo systemctl restart nginx
```

### 4. 최종 확인

```bash
# 백엔드 서버 상태
pm2 list
pm2 logs lolfm-backend --lines 10

# 개발 서버가 실행 중이지 않은지 확인
ps aux | grep "react-scripts\|webpack-dev-server"
# 아무것도 나오지 않아야 함

# 빌드 파일 확인
ls -la ~/LOLFM/frontend/build/static/js/ | head -5

# Nginx 로그 확인
sudo tail -f /var/log/nginx/error.log
```

### 5. 브라우저에서 확인

1. **시크릿 모드**로 열기 (캐시 무시)
2. 개발자 도구 > Network 탭 > WS 필터
3. 확인 사항:
   - ✅ `wss://berrple.com/socket.io/?EIO=4&transport=websocket` 연결 성공
   - ❌ `wss://berrple.com:3000/ws` 오류가 없어야 함

## 문제 해결

### 여전히 `wss://berrple.com:3000/ws` 오류가 나는 경우

1. **브라우저 캐시 완전 삭제**
   - `Ctrl + Shift + Delete`
   - 모든 시간 선택
   - 캐시된 이미지 및 파일 삭제

2. **시크릿 모드로 테스트**
   - Chrome: `Ctrl + Shift + N`
   - Firefox: `Ctrl + Shift + P`

3. **개발 서버 프로세스 재확인**
   ```bash
   ps aux | grep "react-scripts\|webpack-dev-server"
   # 여전히 실행 중이면 강제 종료
   kill -9 $(pgrep -f "react-scripts")
   ```

4. **Nginx 설정 재확인**
   - `proxy_pass http://localhost:3000;` 같은 설정이 있으면 제거
   - `root` 디렉토리가 빌드 폴더를 가리키는지 확인

