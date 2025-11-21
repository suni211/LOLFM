# 프론트엔드 시작 가이드

## 프로덕션 환경 (현재 - berrple.com)

### ✅ 올바른 방법: 프로덕션 빌드 사용

프로덕션 환경에서는 **개발 서버를 실행하지 않고**, 빌드된 정적 파일을 Nginx로 서빙합니다.

```bash
cd ~/LOLFM/frontend

# 1. 프로덕션 빌드 생성
npm run build

# 2. 빌드 확인
ls -la build/

# 3. Nginx가 빌드된 파일을 서빙하는지 확인
# (Nginx 설정에서 root /home/ine158lovely/LOLFM/frontend/build; 확인)

# 4. Nginx 재시작 (필요시)
sudo systemctl restart nginx
```

**중요**: 프로덕션에서는 `npm start`를 실행하지 않습니다!

### ❌ 잘못된 방법: 개발 서버 실행

```bash
# ❌ 이렇게 하면 안 됩니다!
npm start
# 이것은 개발 서버를 실행하며, wss://berrple.com:3000/ws 오류를 발생시킵니다
```

---

## 로컬 개발 환경 (localhost)

로컬에서 개발할 때만 개발 서버를 사용합니다.

```bash
cd ~/LOLFM/frontend

# 1. 개발 서버 시작
npm start

# 브라우저에서 http://localhost:3000 접속
```

**개발 서버 특징:**
- 포트 3000에서 실행
- Hot Module Replacement (HMR) 지원
- 실시간 코드 변경 반영
- `wss://localhost:3000/ws` WebSocket 사용 (정상)

---

## 프로덕션 vs 개발 모드 비교

| 항목 | 프로덕션 (빌드) | 개발 모드 |
|------|----------------|----------|
| 명령어 | `npm run build` | `npm start` |
| 서버 | Nginx (정적 파일) | webpack-dev-server |
| 포트 | 80/443 (Nginx) | 3000 |
| WebSocket | `ws://berrple.com/socket.io` | `ws://localhost:3000/ws` |
| 사용 환경 | 프로덕션 서버 | 로컬 개발 |
| 코드 변경 | 재빌드 필요 | 실시간 반영 |

---

## 현재 상황 확인

### 프로덕션 환경에서 확인할 사항

```bash
# 1. 개발 서버가 실행 중이지 않은지 확인
ps aux | grep "react-scripts\|webpack-dev-server" | grep -v grep
# 아무것도 나오지 않아야 함

# 2. 빌드 파일 확인
ls -la ~/LOLFM/frontend/build/static/js/ | head -5

# 3. Nginx 설정 확인
sudo cat /etc/nginx/sites-available/berrple.com | grep "root"

# 4. Nginx 상태 확인
sudo systemctl status nginx

# 5. 백엔드 서버 확인
pm2 list
pm2 logs lolfm-backend --lines 10
```

---

## 빌드 후 변경사항 반영

코드를 수정한 후 프로덕션에 반영하려면:

```bash
cd ~/LOLFM/frontend

# 1. 변경사항 확인 (Git 사용 시)
git status

# 2. 프로덕션 빌드
npm run build

# 3. 빌드 확인
ls -la build/static/js/ | head -5

# 4. Nginx 재시작 (필요시)
sudo systemctl restart nginx
```

**참고**: Nginx는 정적 파일을 캐시할 수 있으므로, 브라우저 캐시를 삭제하거나 시크릿 모드로 테스트하세요.

---

## 문제 해결

### 개발 서버가 실행 중인 경우

```bash
# 개발 서버 프로세스 확인
ps aux | grep "react-scripts\|webpack-dev-server"

# 개발 서버 종료
pkill -9 -f "react-scripts"
pkill -9 -f "webpack-dev-server"

# PM2에서도 확인
pm2 list
# lolfm-frontend가 있으면 삭제
pm2 delete lolfm-frontend
```

### 빌드 오류가 발생하는 경우

```bash
cd ~/LOLFM/frontend

# 1. 캐시 삭제
rm -rf node_modules/.cache
rm -rf build

# 2. 의존성 재설치
npm install

# 3. 재빌드
npm run build
```

### Nginx가 빌드 파일을 찾지 못하는 경우

```bash
# 1. 빌드 파일 확인
ls -la ~/LOLFM/frontend/build/

# 2. Nginx 설정 확인
sudo nano /etc/nginx/sites-available/berrple.com
# root /home/ine158lovely/LOLFM/frontend/build; 확인

# 3. Nginx 재시작
sudo nginx -t
sudo systemctl restart nginx

# 4. Nginx 로그 확인
sudo tail -f /var/log/nginx/error.log
```

---

## 요약

### 프로덕션 환경 (berrple.com)
```bash
npm run build  # 빌드만 생성
# Nginx가 자동으로 서빙
```

### 로컬 개발 환경
```bash
npm start  # 개발 서버 실행
# http://localhost:3000 접속
```

**핵심**: 프로덕션에서는 개발 서버(`npm start`)를 실행하지 않습니다!

