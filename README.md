# LOLFM - 리그 오브 레전드 경영 시뮬레이션

리그 오브 레전드 팀 경영 시뮬레이션 게임입니다.

## 기술 스택

- **백엔드**: Node.js (Express)
- **프론트엔드**: React
- **데이터베이스**: MariaDB
- **실시간 통신**: Socket.IO
- **인증**: Google OAuth (Passport.js)
- **파일 업로드**: Multer

## 프로젝트 구조

```
LOLFM/
├── backend/          # Node.js 백엔드 서버
│   ├── services/     # 비즈니스 로직
│   ├── routes/       # API 라우트
│   ├── middleware/   # 미들웨어 (업로드 등)
│   ├── database/     # 데이터베이스 스키마
│   └── public/       # 정적 파일 (업로드된 로고 등)
├── frontend/         # React 프론트엔드
└── README.md
```

## 주요 기능

### ✅ 완료된 기능
- 4개 지역 리그 시스템 (ASIA, AMERICA, EUROPE, AFRICA)
- 1부/2부 리그 구조 (1부 8팀, 2부 10팀)
- 구글 OAuth 로그인
- Socket.IO 실시간 유저 수 추적 (IP 기반)
- 시설 유지비 시스템 (경기장, 숙소)
- 파산 및 구조조정 시스템
- 게임오버 시스템 (계정 영구 차단)
- 게임 시간 시스템 (6시간 = 1달, 24시간 = 4달)
- **팀 로고 업로드 시스템** ✨

### 🚧 구현 예정
- 선수 육성 및 성장 시스템
- 경기장 및 숙소 건물 경영
- 스폰서 시스템
- 선수 협상 및 이적 시스템
- 자동 스케줄 생성
- 월즈 챔피언십

## 설치 방법

### 1. 데이터베이스 설정

MariaDB를 설치하고 데이터베이스를 생성합니다:

```sql
CREATE DATABASE lolfm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

스키마 파일을 실행합니다:

```bash
mysql -u root -p lolfm < backend/database/schema.sql
```

로고 컬럼 추가 마이그레이션 실행:

```bash
mysql -u root -p lolfm < backend/database/migrations/add_logo_to_teams.sql
```

### 2. 백엔드 설정

```bash
cd backend
npm install
```

`.env` 파일을 생성하고 설정합니다:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=lolfm

JWT_SECRET=your-secret-key-here
SESSION_SECRET=your-session-secret-key-here

PORT=5000
FRONTEND_URL=http://localhost:3000

GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
```

업로드 디렉토리 생성:

```bash
mkdir -p backend/public/uploads/logos
```

서버 실행:

```bash
npm run dev
```

### 3. 프론트엔드 설정

```bash
cd frontend
npm install
```

`.env` 파일을 생성합니다:

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
```

앱 실행:

```bash
npm start
```

## 로고 업로드 시스템

### 기능
- 팀 로고 이미지 업로드
- 로고 미리보기
- 로고 삭제
- 파일 형식: JPEG, JPG, PNG, GIF, WEBP
- 파일 크기 제한: 5MB
- 권장 크기: 200x200px ~ 500x500px

### API 엔드포인트

#### 로고 업로드
```
POST /api/teams/:teamId/logo
Content-Type: multipart/form-data
Body: logo (file)
```

#### 로고 삭제
```
DELETE /api/teams/:teamId/logo
```

#### 로고 조회
로고는 팀 정보 조회 시 `logo_path` 필드에 포함됩니다.
```
GET /api/teams/:teamId
```

### 사용 예시

```javascript
// 프론트엔드에서 로고 업로드
const formData = new FormData();
formData.append('logo', file);

await axios.post(
  `${API_URL}/teams/${teamId}/logo`,
  formData,
  {
    headers: { 'Content-Type': 'multipart/form-data' },
    withCredentials: true
  }
);
```

## 게임 시스템

### 게임 시간
- **6시간 = 1달** (게임 내 시간)
- **24시간 = 4달**
- 자동으로 시간이 흐르며 월별 정산이 진행됩니다
- 스토브리그: 12월 1일 ~ 1월 1일

### 재정 관리
- **수입원**: 경기장 티켓, 스폰서, 리그 보너스, 월즈 보상
- **지출**: 선수 주급, 시설 유지비, 장비, 스카우트 비용
- **파산 시스템**: 자금이 0원 이하로 떨어지면 구조조정 시작
- **구조조정**: 고액 연봉 선수 해고, 시설 레벨 하락, 스폰서 해지
- **게임오버**: 구조조정 실패 시 계정 영구 차단

### 시설 유지비
- **경기장**: 레벨별 월 유지비 발생 (1레벨: 50만원 ~ 10레벨: 2억 5천만원)
- **숙소**: 레벨별 월 유지비 발생 (1레벨: 30만원 ~ 20레벨: 7억원)
- **선수 주급**: 월별 지급

## API 엔드포인트

### 인증
- `GET /api/auth/google` - 구글 로그인
- `GET /api/auth/logout` - 로그아웃
- `GET /api/auth/me` - 현재 사용자 정보

### 팀 관리
- `GET /api/teams/:teamId` - 팀 정보 조회
- `GET /api/teams/user/:userId` - 사용자 팀 조회
- `POST /api/teams` - 팀 생성
- `POST /api/teams/:teamId/logo` - 로고 업로드
- `DELETE /api/teams/:teamId/logo` - 로고 삭제

### 재정
- `POST /api/financial/settlement/:teamId` - 월별 정산 처리
- `GET /api/financial/maintenance/:teamId` - 유지비 조회
- `GET /api/financial/warning/:teamId` - 자금 경고 체크
- `GET /api/financial/records/:teamId` - 재정 이력 조회
- `GET /api/financial/bankruptcy-history/:teamId` - 파산 이력 조회

## 게임 아이디어

자세한 게임 아이디어와 기능 제안은 `GAME_IDEAS.md` 파일을 참고하세요.

## 라이선스

ISC
