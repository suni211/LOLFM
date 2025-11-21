# 프론트엔드 디버깅 가이드

## 현재 상태
- ✅ Nginx 실행 중
- ✅ 빌드 파일 존재
- ✅ Nginx 설정 올바름
- ❌ 프론트엔드가 안 뜸

## 즉시 확인할 사항

### 1. 백엔드 서버 확인

```bash
# 백엔드 서버 상태
pm2 list

# 백엔드 로그 확인
pm2 logs lolfm-backend --lines 20

# 백엔드가 응답하는지 확인
curl http://localhost:5000/api/health
```

### 2. Nginx 액세스 로그 확인

```bash
# 최근 접속 로그
sudo tail -50 /var/log/nginx/access.log

# 에러 로그
sudo tail -50 /var/log/nginx/error.log
```

### 3. 로컬에서 직접 테스트

```bash
# 빌드 파일이 정상인지 확인
cd ~/LOLFM/frontend/build
python3 -m http.server 8080
```

브라우저에서 `http://localhost:8080` 접속하여 빌드 파일이 정상인지 확인

### 4. 포트 및 방화벽 확인

```bash
# 포트 80이 열려있는지 확인
sudo netstat -tlnp | grep :80
sudo ss -tlnp | grep :80

# 방화벽 상태
sudo ufw status

# 필요시 포트 열기
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

### 5. DNS 확인

```bash
# 도메인이 올바르게 설정되어 있는지 확인
nslookup berrple.com
dig berrple.com

# 또는
curl -I http://berrple.com
```

### 6. 빌드 파일 내용 확인

```bash
# index.html 내용 확인
cat ~/LOLFM/frontend/build/index.html

# JavaScript 파일 확인
ls -la ~/LOLFM/frontend/build/static/js/
head -20 ~/LOLFM/frontend/build/static/js/*.js | head -20
```

### 7. 브라우저에서 확인할 사항

1. **개발자 도구 열기** (F12)
2. **Console 탭** 확인 - JavaScript 오류가 있는지
3. **Network 탭** 확인:
   - `index.html` 로드 여부
   - JavaScript 파일 로드 여부
   - 상태 코드 (200, 404, 500 등)
   - 에러 메시지

### 8. Nginx 재시작

```bash
# 설정 다시 테스트
sudo nginx -t

# 재시작
sudo systemctl restart nginx

# 상태 확인
sudo systemctl status nginx
```

### 9. 파일 권한 재확인

```bash
# 빌드 파일 권한
chmod -R 755 ~/LOLFM/frontend/build
chown -R ine158lovely:ine158lovely ~/LOLFM/frontend/build

# index.html 읽기 권한 확인
cat ~/LOLFM/frontend/build/index.html
```

### 10. 브라우저 캐시 완전 삭제

1. `Ctrl + Shift + Delete` (Windows) 또는 `Cmd + Shift + Delete` (Mac)
2. **모든 시간** 선택
3. **캐시된 이미지 및 파일** 체크
4. 삭제
5. **시크릿 모드**로 다시 접속

## 빠른 진단 스크립트

```bash
#!/bin/bash

echo "=== 백엔드 서버 ==="
pm2 list
echo ""

echo "=== 백엔드 헬스 체크 ==="
curl -s http://localhost:5000/api/health || echo "❌ 백엔드 응답 없음"
echo ""

echo "=== 포트 80 확인 ==="
sudo netstat -tlnp | grep :80 || echo "❌ 포트 80이 열려있지 않음"
echo ""

echo "=== Nginx 액세스 로그 (최근 5줄) ==="
sudo tail -5 /var/log/nginx/access.log
echo ""

echo "=== Nginx 에러 로그 (최근 5줄) ==="
sudo tail -5 /var/log/nginx/error.log
echo ""

echo "=== 빌드 파일 확인 ==="
ls -la ~/LOLFM/frontend/build/index.html
echo ""

echo "=== index.html 첫 10줄 ==="
head -10 ~/LOLFM/frontend/build/index.html
```

## 일반적인 문제 해결

### 빈 페이지가 뜨는 경우
- JavaScript 파일이 로드되지 않음
- Console 탭에서 오류 확인
- Network 탭에서 JavaScript 파일 로드 여부 확인

### 404 오류
- 빌드 파일 경로 확인
- Nginx root 설정 확인

### 502 Bad Gateway
- 백엔드 서버가 실행 중인지 확인
- 포트 5000이 열려있는지 확인

### 연결 시간 초과
- 방화벽 확인
- DNS 설정 확인
- GCP 방화벽 규칙 확인

