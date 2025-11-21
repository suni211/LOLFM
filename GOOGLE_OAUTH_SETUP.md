# Google OAuth 2.0 설정 완료 가이드

## 현재 설정 정보

- **Client ID**: `YOUR_GOOGLE_CLIENT_ID` (Google Cloud Console에서 확인)
- **Client Secret**: `YOUR_GOOGLE_CLIENT_SECRET` (Google Cloud Console에서 확인)
- **도메인**: `berrple.com`

## ⚠️ 중요: Google Cloud Console에서 리디렉션 URI 수정 필요

현재 리디렉션 URI가 잘못 설정되어 있습니다. 다음으로 수정해야 합니다:

### 현재 (잘못됨):
```
https://berrple.com/
https://berrple.com
```

### 수정해야 할 URI:
```
https://berrple.com/api/auth/google/callback
```

## Google Cloud Console에서 수정하는 방법

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 프로젝트 선택: `the-respect-478614-q0`
3. **API 및 서비스** > **사용자 인증 정보**
4. OAuth 2.0 클라이언트 ID 클릭
5. **승인된 리디렉션 URI** 섹션에서:
   - 기존 URI 삭제: `https://berrple.com/`, `https://berrple.com`
   - 다음 URI 추가: `https://berrple.com/api/auth/google/callback`
6. **저장** 클릭

### 최종 리디렉션 URI 목록:
```
https://berrple.com/api/auth/google/callback
http://localhost:5000/api/auth/google/callback  (개발용, 선택사항)
```

### 승인된 JavaScript 원본:
```
https://berrple.com
http://localhost:3000  (개발용)
http://localhost:5173  (개발용, Vite)
```

## 백엔드 .env 파일 설정

GCP SSH에서:

```bash
cd ~/LOLFM/backend
nano .env
```

다음 내용 입력:

```env
# 데이터베이스 설정
DB_HOST=localhost
DB_PORT=3306
DB_USER=lolfm_user
DB_PASSWORD=설정한_데이터베이스_비밀번호
DB_NAME=lolfm

# JWT 시크릿 키
JWT_SECRET=생성한_JWT_시크릿_키

# 서버 포트
PORT=5000

# 프론트엔드 URL
FRONTEND_URL=https://berrple.com

# Google OAuth 2.0 설정
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET
GOOGLE_CALLBACK_URL=https://berrple.com/api/auth/google/callback

# 환경 설정
NODE_ENV=production
```

## 프론트엔드 .env 파일 설정

```bash
cd ~/LOLFM/frontend
nano .env
```

```env
REACT_APP_API_URL=https://berrple.com/api
```

## 서버 재시작

```bash
# 백엔드 재시작
WebSocketClient.js:13 WebSocket connection to 'wss://berrple.com:3000/ws' failed: 
WebSocketClient	@	WebSocketClient.js:13
initSocket	@	socket.js:27
(anonymous)	@	socket.js
```

## 테스트

1. 브라우저에서 `https://berrple.com` 접속
2. "구글로 로그인" 클릭
3. Google 로그인 완료
4. 자동으로 `https://berrple.com?token=...`로 리다이렉트되어야 함

## 문제 해결

### 리디렉션 URI 불일치 오류
- Google Cloud Console에서 리디렉션 URI가 정확히 `https://berrple.com/api/auth/google/callback`인지 확인
- `.env` 파일의 `GOOGLE_CALLBACK_URL`이 동일한지 확인

### CORS 오류
- Google Cloud Console의 **승인된 JavaScript 원본**에 `https://berrple.com`이 포함되어 있는지 확인

### 토큰이 URL에 표시되지 않음
- 브라우저 개발자 도구에서 네트워크 탭 확인
- 백엔드 로그 확인: `pm2 logs lolfm-backend`

