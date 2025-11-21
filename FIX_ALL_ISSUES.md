# 모든 오류 해결 가이드

## 현재 문제들

1. **WebSocket 연결 오류**: `wss://berrple.com:3000/ws`로 연결 시도
2. **Notifications 401 오류**: 인증 토큰 문제
3. **Facilities 404 오류**: 라우트 문제

## 해결 방법

### 1. 프론트엔드 재빌드 (필수!)

GCP SSH에서:

```bash
cd ~/LOLFM/frontend

# .env 파일 확인/생성
cat .env
# 또는
nano .env
```

`.env` 파일 내용:
```env
REACT_APP_API_URL=https://berrple.com/api
REACT_APP_SOCKET_URL=https://berrple.com
```

**중요**: 포트 번호를 포함하지 마세요!

```bash
# 캐시 삭제
rm -rf node_modules/.cache
rm -rf build

# 재빌드
npm run build

# 빌드 확인
ls -la build/static/js/ | head -5
```

### 2. 브라우저 캐시 완전 삭제

1. `Ctrl + Shift + Delete` (Windows) 또는 `Cmd + Shift + Delete` (Mac)
2. **모든 시간** 선택
3. **캐시된 이미지 및 파일** 체크
4. 삭제
5. 페이지 새로고침 (`Ctrl + F5` 또는 `Cmd + Shift + R`)

또는 **시크릿 모드**로 테스트:
- Chrome: `Ctrl + Shift + N`
- Firefox: `Ctrl + Shift + P`

### 3. 백엔드 서버 재시작

```bash
pm2 restart lolfm-backend
pm2 logs lolfm-backend --lines 50
```

### 4. 확인 사항

브라우저 개발자 도구 > Network 탭:

1. **WebSocket 연결 확인**:
   - WS 필터 선택
   - `wss://berrple.com/socket.io/?EIO=4&transport=websocket` 형태여야 함
   - `wss://berrple.com:3000/ws` 오류가 없어야 함

2. **API 요청 확인**:
   - `/api/notifications` 요청이 200 또는 401이 아닌 다른 상태여야 함
   - Authorization 헤더가 포함되어 있는지 확인

3. **Console 로그 확인**:
   - `🔌 Socket.IO 연결 시도: https://berrple.com` 메시지 확인
   - `✅ Socket.IO 연결 성공` 메시지 확인

## 코드 수정 사항

### socket.js
- 런타임에 URL 결정 (빌드 시점이 아닌 실행 시점)
- 프로덕션 환경 자동 감지
- 포트 번호 자동 제거

### notifications.js
- server.js와 동일한 인증 로직 사용
- AuthService를 통한 토큰 검증

## 문제가 계속되면

1. **빌드 파일 확인**:
   ```bash
   cd ~/LOLFM/frontend/build/static/js
   grep -r "3000" *.js | head -5
   ```
   `3000`이 포함된 파일이 있으면 빌드가 제대로 안 된 것입니다.

2. **Nginx 재시작**:
   ```bash
   sudo nginx -t
   sudo systemctl restart nginx
   ```

3. **PM2 로그 확인**:
   ```bash
   pm2 logs lolfm-backend --lines 100
   ```

