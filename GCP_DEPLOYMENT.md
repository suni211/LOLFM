# GCP 배포 가이드 - DB 및 .env 설정

## 1. 데이터베이스 설정 (MariaDB)

### 옵션 1: Cloud SQL (MariaDB) 사용 (권장)

#### 1.1 Cloud SQL 인스턴스 생성

```bash
# gcloud CLI로 인스턴스 생성
gcloud sql instances create lolfm-db \
  --database-version=MARIADB_10_11 \
  --tier=db-f1-micro \
  --region=asia-northeast3 \
  --root-password=YOUR_ROOT_PASSWORD
```

또는 GCP 콘솔에서:
1. Cloud SQL → 인스턴스 생성
2. 데이터베이스 엔진: **MariaDB** 선택
3. 인스턴스 ID: `lolfm-db`
4. 비밀번호 설정
5. 리전 선택 (예: asia-northeast3 - 서울)
6. 머신 타입: db-f1-micro (테스트용) 또는 db-n1-standard-1 (프로덕션)

#### 1.2 데이터베이스 생성

```bash
gcloud sql databases create lolfm --instance=lolfm-db
```

또는 GCP 콘솔에서:
1. Cloud SQL → 인스턴스 선택
2. 데이터베이스 탭 → 데이터베이스 추가
3. 데이터베이스 이름: `lolfm`

#### 1.3 사용자 생성 (선택사항)

```bash
gcloud sql users create lolfm_user \
  --instance=lolfm-db \
  --password=YOUR_USER_PASSWORD
```

#### 1.4 스키마 적용

```bash
# 로컬에서 스키마 파일을 Cloud SQL에 적용
gcloud sql import sql lolfm-db \
  gs://YOUR_BUCKET_NAME/schema.sql \
  --database=lolfm

# 또는 직접 연결하여 적용
mysql -h [INSTANCE_IP] -u root -p lolfm < backend/database/schema.sql
```

#### 1.5 연결 정보 확인

```bash
# 인스턴스 IP 주소 확인
gcloud sql instances describe lolfm-db --format="value(ipAddresses[0].ipAddress)"

# 또는 GCP 콘솔에서 확인
# Cloud SQL → 인스턴스 → 연결 → 공개 IP 주소
```

### 옵션 2: Compute Engine에 MariaDB 직접 설치

```bash
# VM 인스턴스 생성 후
sudo apt-get update
sudo apt-get install mariadb-server

# MariaDB 설정
sudo mysql_secure_installation

# 데이터베이스 생성
sudo mysql -u root -p
CREATE DATABASE lolfm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'lolfm_user'@'%' IDENTIFIED BY 'YOUR_PASSWORD';
GRANT ALL PRIVILEGES ON lolfm.* TO 'lolfm_user'@'%';
FLUSH PRIVILEGES;
EXIT;

# 방화벽 규칙 추가 (3306 포트)
gcloud compute firewall-rules create allow-mysql \
  --allow tcp:3306 \
  --source-ranges 0.0.0.0/0 \
  --description "Allow MySQL"
```

## 2. .env 파일 설정

### 2.1 프로덕션 .env 파일 생성

프로덕션 환경에서는 `.env` 파일을 직접 사용하지 않고, GCP의 Secret Manager나 환경 변수를 사용하는 것이 좋습니다.

#### 옵션 1: Secret Manager 사용 (권장)

```bash
# Secret 생성
gcloud secrets create lolfm-db-host --data-file=- <<< "YOUR_DB_HOST"
gcloud secrets create lolfm-db-port --data-file=- <<< "3306"
gcloud secrets create lolfm-db-user --data-file=- <<< "lolfm_user"
gcloud secrets create lolfm-db-password --data-file=- <<< "YOUR_DB_PASSWORD"
gcloud secrets create lolfm-db-name --data-file=- <<< "lolfm"
gcloud secrets create lolfm-jwt-secret --data-file=- <<< "YOUR_JWT_SECRET"
gcloud secrets create lolfm-session-secret --data-file=- <<< "YOUR_SESSION_SECRET"
gcloud secrets create lolfm-google-client-id --data-file=- <<< "YOUR_GOOGLE_CLIENT_ID"
gcloud secrets create lolfm-google-client-secret --data-file=- <<< "YOUR_GOOGLE_CLIENT_SECRET"
```

#### 옵션 2: Cloud Run 환경 변수 설정

Cloud Run 서비스 생성 시:

```bash
gcloud run deploy lolfm-backend \
  --source . \
  --region asia-northeast3 \
  --set-env-vars="DB_HOST=YOUR_DB_HOST,DB_PORT=3306,DB_USER=lolfm_user,DB_PASSWORD=YOUR_PASSWORD,DB_NAME=lolfm,JWT_SECRET=YOUR_JWT_SECRET,SESSION_SECRET=YOUR_SESSION_SECRET,GOOGLE_CLIENT_ID=YOUR_CLIENT_ID,GOOGLE_CLIENT_SECRET=YOUR_CLIENT_SECRET,FRONTEND_URL=https://your-frontend-url.com"
```

#### 옵션 3: App Engine app.yaml 사용

`app.yaml` 파일 생성:

```yaml
runtime: nodejs18

env_variables:
  DB_HOST: "YOUR_DB_HOST"
  DB_PORT: "3306"
  DB_USER: "lolfm_user"
  DB_PASSWORD: "YOUR_DB_PASSWORD"
  DB_NAME: "lolfm"
  JWT_SECRET: "YOUR_JWT_SECRET"
  SESSION_SECRET: "YOUR_SESSION_SECRET"
  PORT: "8080"
  FRONTEND_URL: "https://your-frontend-url.com"
  GOOGLE_CLIENT_ID: "YOUR_GOOGLE_CLIENT_ID"
  GOOGLE_CLIENT_SECRET: "YOUR_GOOGLE_CLIENT_SECRET"
  GOOGLE_CALLBACK_URL: "https://your-backend-url.com/api/auth/google/callback"
```

### 2.2 .env 파일 템플릿

로컬 테스트용 `.env` 파일 (절대 커밋하지 마세요):

```env
# 데이터베이스 설정 (Cloud SQL 사용 시)
DB_HOST=YOUR_CLOUD_SQL_INSTANCE_IP
DB_PORT=3306
DB_USER=lolfm_user
DB_PASSWORD=YOUR_DB_PASSWORD
DB_NAME=lolfm

# 또는 Cloud SQL Unix Socket 사용 (Cloud Run/App Engine에서 권장)
# DB_HOST=/cloudsql/PROJECT_ID:REGION:INSTANCE_NAME
# DB_PORT=3306
# DB_USER=lolfm_user
# DB_PASSWORD=YOUR_DB_PASSWORD
# DB_NAME=lolfm

# JWT 시크릿 키
JWT_SECRET=your-production-jwt-secret-key-here

# 세션 시크릿 키
SESSION_SECRET=your-production-session-secret-key-here

# 서버 포트
PORT=8080

# 프론트엔드 URL (프로덕션)
FRONTEND_URL=https://your-frontend-domain.com

# 구글 OAuth 설정
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=https://your-backend-domain.com/api/auth/google/callback
```

## 3. Cloud SQL 연결 설정

### 3.1 Cloud Run에서 Cloud SQL 연결

`cloudbuild.yaml` 또는 배포 시:

```yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: lolfm-backend
spec:
  template:
    metadata:
      annotations:
        cloud.sql/instances: PROJECT_ID:REGION:INSTANCE_NAME
    spec:
      containers:
      - image: gcr.io/PROJECT_ID/lolfm-backend
        env:
        - name: DB_HOST
          value: /cloudsql/PROJECT_ID:REGION:INSTANCE_NAME
```

또는 gcloud 명령어:

```bash
gcloud run deploy lolfm-backend \
  --add-cloudsql-instances PROJECT_ID:REGION:INSTANCE_NAME \
  --set-env-vars="DB_HOST=/cloudsql/PROJECT_ID:REGION:INSTANCE_NAME"
```

### 3.2 App Engine에서 Cloud SQL 연결

`app.yaml`에 추가:

```yaml
beta_settings:
  cloud_sql_instances: PROJECT_ID:REGION:INSTANCE_NAME
```

## 4. 보안 설정

### 4.1 방화벽 규칙

Cloud SQL 인스턴스는 기본적으로 공개 IP를 가지지만, 특정 IP만 허용하도록 설정:

```bash
# 특정 IP만 허용
gcloud sql instances patch lolfm-db \
  --authorized-networks=YOUR_SERVER_IP/32

# 또는 Cloud Run/App Engine에서만 접근 허용 (Private IP 사용)
```

### 4.2 SSL 연결 (권장)

```bash
# SSL 인증서 다운로드
gcloud sql ssl-certs create client-cert \
  --instance=lolfm-db

# MariaDB 연결 시 SSL 사용
# backend/server.js에서 SSL 옵션 추가 필요
```

## 5. 백엔드 코드 수정 (Cloud SQL 연결)

`backend/server.js`에서 Cloud SQL Unix Socket 지원:

```javascript
// Cloud SQL Unix Socket 사용 (프로덕션)
const pool = mariadb.createPool({
  socketPath: process.env.DB_HOST.startsWith('/cloudsql/') 
    ? process.env.DB_HOST 
    : null,
  host: process.env.DB_HOST.startsWith('/cloudsql/') 
    ? null 
    : process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'lolfm',
  connectionLimit: 5,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false
});
```

## 6. 체크리스트

- [ ] Cloud SQL 인스턴스 생성 완료
- [ ] 데이터베이스 및 사용자 생성 완료
- [ ] 스키마 파일 적용 완료
- [ ] 환경 변수 설정 완료 (Secret Manager 또는 app.yaml)
- [ ] Cloud SQL 연결 설정 완료
- [ ] 방화벽 규칙 설정 완료
- [ ] SSL 연결 설정 (선택사항)
- [ ] 백엔드 코드에서 Cloud SQL 연결 테스트

## 7. 테스트

```bash
# 로컬에서 Cloud SQL 연결 테스트
mysql -h YOUR_CLOUD_SQL_IP -u lolfm_user -p lolfm

# 또는 gcloud proxy 사용
cloud_sql_proxy -instances=PROJECT_ID:REGION:INSTANCE_NAME=tcp:3306
mysql -h 127.0.0.1 -u lolfm_user -p lolfm
```

## 참고사항

1. **비용**: Cloud SQL은 사용량에 따라 비용이 발생합니다. db-f1-micro는 무료 티어가 있지만 제한적입니다.
2. **성능**: 프로덕션 환경에서는 db-n1-standard-1 이상을 권장합니다.
3. **백업**: Cloud SQL은 자동 백업을 제공합니다. 설정에서 활성화하세요.
4. **모니터링**: Cloud SQL 인스턴스 모니터링을 활성화하여 성능을 추적하세요.

