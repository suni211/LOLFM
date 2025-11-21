#!/bin/bash
# 스키마 적용 스크립트

echo "=== LOLFM 데이터베이스 스키마 적용 ==="

# 비밀번호 입력
read -sp "lolfm_user 비밀번호: " DB_PASSWORD
echo ""

# 스키마 적용
echo "스키마 적용 중..."
mysql -u lolfm_user -p$DB_PASSWORD lolfm < backend/database/schema.sql

if [ $? -eq 0 ]; then
    echo "✅ 스키마 적용 완료!"
    
    # 마이그레이션 적용
    echo "마이그레이션 적용 중..."
    if [ -f "backend/database/migrations/add_logo_to_teams.sql" ]; then
        mysql -u lolfm_user -p$DB_PASSWORD lolfm < backend/database/migrations/add_logo_to_teams.sql
        if [ $? -eq 0 ]; then
            echo "✅ 마이그레이션 적용 완료!"
        else
            echo "⚠️  마이그레이션 적용 실패 (이미 적용되었을 수 있음)"
        fi
    fi
    
    # 확인
    echo ""
    echo "=== 테이블 목록 ==="
    mysql -u lolfm_user -p$DB_PASSWORD lolfm -e "SHOW TABLES;"
    
    echo ""
    echo "=== 초기 데이터 확인 ==="
    mysql -u lolfm_user -p$DB_PASSWORD lolfm -e "SELECT * FROM regions;"
    mysql -u lolfm_user -p$DB_PASSWORD lolfm -e "SELECT * FROM leagues;"
    mysql -u lolfm_user -p$DB_PASSWORD lolfm -e "SELECT * FROM game_time;"
    
    echo ""
    echo "✅ 모든 작업 완료!"
else
    echo "❌ 스키마 적용 실패"
    exit 1
fi

