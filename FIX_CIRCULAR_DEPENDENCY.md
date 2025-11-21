# 순환 의존성 문제 해결 완료

## 문제
`Warning: Accessing non-existent property 'pool' of module exports inside circular dependency`

## 해결 방법

### 1. pool을 별도 파일로 분리
- `backend/database/pool.js` 생성
- 모든 파일에서 `require('../server')` 대신 `require('../database/pool')` 사용

### 2. 변경된 파일들
- ✅ `backend/server.js` - pool을 별도 파일에서 import
- ✅ 모든 `backend/services/*.js` 파일들
- ✅ 모든 `backend/routes/*.js` 파일들

### 3. notificationService.js 특별 처리
- `io`는 순환 의존성을 피하기 위해 `setIO()` 메서드로 설정
- `server.js`에서 서버 시작 시 `NotificationService.setIO(io)` 호출

## 적용 방법 (GCP SSH)

```bash
# 1. 최신 코드 가져오기
cd ~/LOLFM
git pull

# 2. PM2 재시작
pm2 restart lolfm-backend

# 3. 로그 확인 (경고가 사라졌는지 확인)
pm2 logs lolfm-backend --lines 20
```

## 확인

순환 의존성 경고가 사라지고 서버가 정상 작동하는지 확인:

```bash
# 서버 상태 확인
pm2 status

# 헬스 체크
curl http://localhost:5000/api/health

# 로그 확인 (경고 없어야 함)
pm2 logs lolfm-backend --lines 10
```

