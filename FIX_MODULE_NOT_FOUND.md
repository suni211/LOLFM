# 모듈을 찾을 수 없는 오류 해결 (GCP SSH)

## 문제
`Error: Cannot find module 'express'` - 백엔드 의존성이 설치되지 않았습니다.

## 해결 방법

### 1. PM2 프로세스 중지

```bash
pm2 stop lolfm-backend
pm2 delete lolfm-backend
```

### 2. 백엔드 디렉토리로 이동 및 의존성 설치

```bash
cd ~/LOLFM/backend

# node_modules 확인
ls -la node_modules

# 의존성 설치
npm install

# 설치 확인
ls -la node_modules | grep express
```

### 3. 모든 의존성 확인

```bash
# package.json 확인
cat package.json

# 필요한 패키지들이 모두 설치되었는지 확인
npm list --depth=0
```

### 4. PM2로 다시 시작

```bash
# 백엔드 디렉토리에서 실행
cd ~/LOLFM/backend

# PM2로 시작 (작업 디렉토리 명시)
pm2 start server.js --name lolfm-backend --cwd ~/LOLFM/backend

# 또는 package.json의 start 스크립트 사용
pm2 start npm --name lolfm-backend -- start --cwd ~/LOLFM/backend

# 자동 시작 설정
pm2 save
```

### 5. 상태 확인

```bash
# PM2 상태 확인
pm2 status

# 로그 확인
pm2 logs lolfm-backend

# 서버가 정상 작동하는지 확인
curl http://localhost:5000/api/health
```

## 전체 재설정 (문제가 계속되면)

```bash
# 1. PM2 프로세스 모두 중지
pm2 stop all
pm2 delete all

# 2. 백엔드 디렉토리로 이동
cd ~/LOLFM/backend

# 3. 기존 node_modules 삭제 (선택사항)
rm -rf node_modules package-lock.json

# 4. 의존성 재설치
npm install

# 5. .env 파일 확인
cat .env

# 6. 수동으로 서버 실행 테스트
node server.js

# Ctrl+C로 중지 후

# 7. PM2로 시작
pm2 start server.js --name lolfm-backend
pm2 save
```

## 프론트엔드도 같은 문제가 있다면

```bash
cd ~/LOLFM/frontend

# 의존성 설치
npm install

# PM2로 시작
pm2 start "npm start" --name lolfm-frontend
pm2 save
```

## 체크리스트

- [ ] 백엔드 디렉토리에서 `npm install` 실행 완료
- [ ] `node_modules` 폴더가 생성되었는지 확인
- [ ] PM2 프로세스가 올바른 디렉토리에서 실행되는지 확인
- [ ] `.env` 파일이 존재하는지 확인
- [ ] 서버가 정상적으로 시작되는지 확인

