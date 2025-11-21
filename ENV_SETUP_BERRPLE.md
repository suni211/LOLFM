# berrple.com 도메인 .env 설정 가이드

## 백엔드 .env 파일 설정

`backend/.env` 파일을 생성하고 다음 내용을 입력하세요:

```env
# 데이터베이스 설정
DB_HOST=localhost
DB_PORT=3306
DB_USER=lolfm_user
DB_PASSWORD=설정한_데이터베이스_비밀번호
DB_NAME=lolfm

# JWT 시크릿 키 (아래 명령어로 생성)
# openssl rand -hex 32
JWT_SECRET=생성한_JWT_시크릿_키

# 서버 포트
PORT=5000

# 프론트엔드 URL
FRONTEND_URL=https://berrple.com

# Google OAuth 2.0 설정
GOOGLE_CLIENT_ID=630470909278-u3sprvh69rhqljmdmi6gmnvc1npj0iro.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=Google_Cloud_Console에서_가져온_시크릿
GOOGLE_CALLBACK_URL=https://berrple.com/api/auth/google/callback

# 환경 설정
NODE_ENV=production
```

## 프론트엔드 .env 파일 설정

`frontend/.env` 파일을 생성하고 다음 내용을 입력하세요:

```env
REACT_APP_API_URL=https://berrple.com/api
```

## JWT 시크릿 키 생성

GCP SSH에서 실행:

```bash
openssl rand -hex 32
```

생성된 키를 `JWT_SECRET`에 입력하세요.

## Google OAuth Client Secret 가져오기

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 프로젝트 선택
3. **API 및 서비스** > **사용자 인증 정보**
4. OAuth 2.0 클라이언트 ID 클릭
5. **클라이언트 보안 비밀번호** 복사
6. `GOOGLE_CLIENT_SECRET`에 입력

## Google Cloud Console 리디렉션 URI 설정

Google Cloud Console에서 다음 URI를 추가하세요:

### 승인된 리디렉션 URI
```
https://berrple.com/api/auth/google/callback
```

### 승인된 JavaScript 원본
```
https://berrple.com
```

## 프록시/리버스 프록시 설정

### Nginx 설정 예시

```nginx
server {
    listen 80;
    server_name berrple.com www.berrple.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name berrple.com www.berrple.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # 프론트엔드 (React)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
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
    }

    # 업로드된 파일
    location /uploads {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
```

## 체크리스트

- [ ] `backend/.env` 파일 생성 및 설정
- [ ] `frontend/.env` 파일 생성 및 설정
- [ ] JWT_SECRET 생성 및 입력
- [ ] Google OAuth Client Secret 입력
- [ ] Google Cloud Console 리디렉션 URI 설정
- [ ] Nginx/프록시 설정 (HTTPS)
- [ ] SSL 인증서 설정
- [ ] 백엔드 서버 실행 (포트 5000)
- [ ] 프론트엔드 빌드 및 실행 (포트 3000 또는 Nginx)

## 보안 주의사항

1. **.env 파일은 절대 Git에 커밋하지 마세요**
2. `.gitignore`에 `.env`가 포함되어 있는지 확인
3. 프로덕션에서는 `NODE_ENV=production` 설정
4. HTTPS 사용 필수 (OAuth 2.0 요구사항)
5. JWT_SECRET은 강력한 랜덤 문자열 사용

## 테스트

설정 완료 후:

1. 백엔드 서버 실행 확인
2. 프론트엔드 접속 확인
3. Google 로그인 테스트
4. API 요청 테스트

