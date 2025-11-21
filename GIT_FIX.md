# Git 충돌 해결 방법

## 문제
```
error: Your local changes to the following files would be overwritten by merge:
        fix_dependencies.sh
```

## 해결 방법

### 방법 1: 변경사항 임시 저장 (Stash) - 권장

```bash
# 변경사항을 임시 저장
git stash

# 최신 코드 가져오기
git pull

# 필요시 저장한 변경사항 다시 적용
git stash pop
```

### 방법 2: 변경사항 버리기 (파일이 중요하지 않은 경우)

```bash
# 로컬 변경사항 버리기
git checkout -- fix_dependencies.sh

# 또는 파일 삭제
rm fix_dependencies.sh

# 최신 코드 가져오기
git pull
```

### 방법 3: 변경사항 커밋하기

```bash
# 변경사항 추가
git add fix_dependencies.sh

# 커밋
git commit -m "Update fix_dependencies.sh"

# 최신 코드 가져오기
git pull
```

## 빠른 해결 (권장)

```bash
# 변경사항 임시 저장
git stash

# Pull
git pull

# 완료!
```

