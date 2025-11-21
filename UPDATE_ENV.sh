#!/bin/bash
# .env 파일 업데이트 스크립트

echo "=== .env 파일 업데이트 ==="

# 백엔드 .env 파일 경로
BACKEND_ENV="$HOME/LOLFM/backend/.env"

# 백엔드 .env 파일이 있는지 확인
if [ ! -f "$BACKEND_ENV" ]; then
    echo "⚠️  백엔드 .env 파일이 없습니다. 생성합니다..."
    touch "$BACKEND_ENV"
fi

# 기존 .env 파일 백업
if [ -f "$BACKEND_ENV" ]; then
    cp "$BACKEND_ENV" "${BACKEND_ENV}.backup.$(date +%Y%m%d_%H%M%S)"
    echo "✅ 기존 .env 파일 백업 완료"
fi

# Google OAuth 설정 업데이트
echo ""
echo "Google OAuth 설정을 업데이트합니다..."

# 기존 GOOGLE_CLIENT_ID가 있으면 유지, 없으면 추가 (사용자가 직접 입력해야 함)
if ! grep -q "GOOGLE_CLIENT_ID" "$BACKEND_ENV"; then
    echo "GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID" >> "$BACKEND_ENV"
    echo "⚠️  GOOGLE_CLIENT_ID를 Google Cloud Console에서 가져와서 .env 파일에 입력하세요"
fi

# 기존 GOOGLE_CLIENT_SECRET이 있으면 유지, 없으면 추가 (사용자가 직접 입력해야 함)
if ! grep -q "GOOGLE_CLIENT_SECRET" "$BACKEND_ENV"; then
    echo "GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET" >> "$BACKEND_ENV"
    echo "⚠️  GOOGLE_CLIENT_SECRET을 Google Cloud Console에서 가져와서 .env 파일에 입력하세요"
fi

# 기존 GOOGLE_CALLBACK_URL이 있으면 업데이트, 없으면 추가
if grep -q "GOOGLE_CALLBACK_URL" "$BACKEND_ENV"; then
    sed -i 's|GOOGLE_CALLBACK_URL=.*|GOOGLE_CALLBACK_URL=https://berrple.com/api/auth/google/callback|' "$BACKEND_ENV"
else
    echo "GOOGLE_CALLBACK_URL=https://berrple.com/api/auth/google/callback" >> "$BACKEND_ENV"
fi

# FRONTEND_URL 업데이트
if grep -q "FRONTEND_URL" "$BACKEND_ENV"; then
    sed -i 's|FRONTEND_URL=.*|FRONTEND_URL=https://berrple.com|' "$BACKEND_ENV"
else
    echo "FRONTEND_URL=https://berrple.com" >> "$BACKEND_ENV"
fi

echo ""
echo "✅ .env 파일 업데이트 완료!"
echo ""
echo "현재 설정:"
grep -E "GOOGLE_|FRONTEND_URL" "$BACKEND_ENV"
echo ""
echo "⚠️  중요: Google Cloud Console에서 리디렉션 URI를 다음으로 설정하세요:"
echo "   https://berrple.com/api/auth/google/callback"
echo ""
echo "서버를 재시작하세요: pm2 restart lolfm-backend"

