# GitHub에 푸시하기

## 문제 해결

Git이 홈 디렉토리에서 실행되고 있습니다. 프로젝트 디렉토리에서 직접 실행하세요.

## 단계별 실행 방법

### 1. PowerShell 또는 명령 프롬프트 열기

### 2. 프로젝트 디렉토리로 이동

```powershell
cd "C:\Users\hisam\OneDrive\바탕 화면\LOLFM"
```

### 3. Git 초기화 (이미 되어있다면 생략)

```powershell
git init
```

### 4. 모든 파일 추가

```powershell
git add .
```

### 5. 첫 커밋

```powershell
git commit -m "Initial commit: LOLFM - 리그 오브 레전드 경영 시뮬레이션 게임 완성"
```

### 6. 브랜치 이름을 main으로 설정

```powershell
git branch -M main
```

### 7. 원격 저장소 추가 (이미 되어있다면 생략)

```powershell
git remote add origin https://github.com/suni211/LOLFM.git
```

또는 이미 추가되어 있다면:

```powershell
git remote set-url origin https://github.com/suni211/LOLFM.git
```

### 8. GitHub에 푸시

```powershell
git push -u origin main
```

## GitHub 저장소 생성 확인

푸시하기 전에 GitHub에서 저장소가 생성되어 있는지 확인하세요:

1. https://github.com/suni211/LOLFM 접속
2. 저장소가 없으면 "New repository"로 생성
3. 저장소 이름: `LOLFM`
4. Public 또는 Private 선택
5. **README, .gitignore, license는 추가하지 마세요** (이미 있음)

## 인증 문제 발생 시

GitHub에 푸시할 때 인증이 필요할 수 있습니다:

1. Personal Access Token 사용
2. 또는 GitHub Desktop 사용
3. 또는 SSH 키 설정

## 완료 후 확인

푸시가 성공하면 다음 URL에서 확인할 수 있습니다:
https://github.com/suni211/LOLFM

