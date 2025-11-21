#!/bin/bash
# 빠른 데이터베이스 설정 스크립트

echo "=== LOLFM 데이터베이스 설정 ==="

# 비밀번호 입력 받기
read -sp "lolfm_user 비밀번호를 입력하세요: " DB_PASSWORD
echo ""
read -sp "MariaDB root 비밀번호를 입력하세요: " ROOT_PASSWORD
echo ""

# 데이터베이스 및 사용자 생성
echo "데이터베이스 및 사용자 생성 중..."
mysql -u root -p$ROOT_PASSWORD <<EOF
CREATE DATABASE IF NOT EXISTS lolfm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'lolfm_user'@'localhost' IDENTIFIED BY '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON lolfm.* TO 'lolfm_user'@'localhost';
FLUSH PRIVILEGES;
SHOW DATABASES;
EOF

if [ $? -eq 0 ]; then
    echo "✅ 데이터베이스 및 사용자 생성 완료!"
    
    # 스키마 적용
    echo "스키마 적용 중..."
    if [ -f "backend/database/schema.sql" ]; then
        mysql -u lolfm_user -p$DB_PASSWORD lolfm < backend/database/schema.sql
        if [ $? -eq 0 ]; then
            echo "✅ 스키마 적용 완료!"
        else
            echo "❌ 스키마 적용 실패"
        fi
    else
        echo "⚠️  schema.sql 파일을 찾을 수 없습니다."
    fi
    
    # 마이그레이션 적용
    echo "마이그레이션 적용 중..."
    if [ -f "backend/database/migrations/add_logo_to_teams.sql" ]; then
        mysql -u lolfm_user -p$DB_PASSWORD lolfm < backend/database/migrations/add_logo_to_teams.sql
        if [ $? -eq 0 ]; then
            echo "✅ 마이그레이션 적용 완료!"
        else
            echo "⚠️  마이그레이션 적용 실패 (이미 적용되었을 수 있음)"
        fi
    else
        echo "⚠️  마이그레이션 파일을 찾을 수 없습니다."
    fi
    
    echo ""
    echo "=== 설정 완료 ==="
    echo "다음 정보를 backend/.env 파일에 입력하세요:"
    echo "DB_HOST=localhost"
    echo "DB_PORT=3306"
    echo "DB_USER=lolfm_user"
    echo "DB_PASSWORD=$DB_PASSWORD"
    echo "DB_NAME=lolfm"
else
    echo "❌ 데이터베이스 생성 실패"
    exit 1
fi

