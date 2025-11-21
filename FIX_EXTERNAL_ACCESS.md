# 외부 접속 문제 해결 (ERR_CONNECTION_REFUSED)

## 문제
- 로컬에서는 접속 가능 (`curl http://localhost` → 200 OK)
- 외부에서는 접속 불가 (`ERR_CONNECTION_REFUSED`)

## 원인
GCP 방화벽 규칙에서 포트 80이 열려있지 않을 가능성이 높습니다.

## 해결 방법

### 1. GCP 방화벽 규칙 확인 및 추가

#### 방법 A: GCP 콘솔에서 설정

1. **GCP 콘솔 접속**
   - https://console.cloud.google.com
   - 프로젝트 선택: `the-respect-478614-q0`

2. **방화벽 규칙 확인**
   - 네비게이션 메뉴 > VPC 네트워크 > 방화벽
   - 또는 직접 URL: https://console.cloud.google.com/networking/firewalls

3. **HTTP 트래픽 허용 규칙 확인**
   - `default-allow-http` 또는 `allow-http` 규칙이 있는지 확인
   - 없으면 생성 필요

4. **방화벽 규칙 생성 (없는 경우)**
   - "방화벽 규칙 만들기" 클릭
   - 이름: `allow-http`
   - 방향: 수신
   - 대상: 네트워크의 모든 인스턴스
   - 소스 IP 범위: `0.0.0.0/0`
   - 프로토콜 및 포트: TCP, 포트 80
   - 만들기 클릭

#### 방법 B: gcloud 명령어로 설정 (SSH에서)

```bash
# 현재 방화벽 규칙 확인
gcloud compute firewall-rules list

# HTTP 트래픽 허용 규칙 생성
gcloud compute firewall-rules create allow-http \
    --allow tcp:80 \
    --source-ranges 0.0.0.0/0 \
    --description "Allow HTTP traffic"

# HTTPS 트래픽 허용 규칙 생성 (선택사항)
gcloud compute firewall-rules create allow-https \
    --allow tcp:443 \
    --source-ranges 0.0.0.0/0 \
    --description "Allow HTTPS traffic"
```

### 2. 서버 외부 IP 확인

```bash
# 서버의 외부 IP 확인
curl -H "Metadata-Flavor: Google" http://169.254.169.254/computeMetadata/v1/instance/network-interfaces/0/access-configs/0/external-ip

# 또는
gcloud compute instances describe instance-20251118-161004 --zone=asia-northeast3-a --format="get(networkInterfaces[0].accessConfigs[0].natIP)"
```

### 3. DNS 설정 확인

```bash
# 도메인 DNS 확인
nslookup berrple.com
dig berrple.com

# 도메인이 서버 IP로 올바르게 설정되어 있는지 확인
```

### 4. Nginx가 외부에서 접근 가능한지 확인

```bash
# Nginx가 0.0.0.0:80으로 리스닝하는지 확인
sudo ss -tlnp | grep :80

# 출력 예시:
# LISTEN 0 511 0.0.0.0:80 0.0.0.0:* users:(("nginx",pid=...))
# 0.0.0.0:80이어야 함 (127.0.0.1:80이면 안 됨)
```

### 5. 로컬 방화벽 확인 (UFW)

```bash
# UFW 상태 확인
sudo ufw status

# 포트 80 허용 (필요시)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

### 6. 테스트

```bash
# 서버 외부 IP로 직접 접속 테스트
EXTERNAL_IP=$(curl -s -H "Metadata-Flavor: Google" http://169.254.169.254/computeMetadata/v1/instance/network-interfaces/0/access-configs/0/external-ip)
echo "외부 IP: $EXTERNAL_IP"
curl -I http://$EXTERNAL_IP
```

## 빠른 해결 스크립트

```bash
#!/bin/bash

echo "=== 서버 외부 IP 확인 ==="
EXTERNAL_IP=$(curl -s -H "Metadata-Flavor: Google" http://169.254.169.254/computeMetadata/v1/instance/network-interfaces/0/access-configs/0/external-ip)
echo "외부 IP: $EXTERNAL_IP"
echo ""

echo "=== Nginx 리스닝 포트 확인 ==="
sudo ss -tlnp | grep :80
echo ""

echo "=== 방화벽 규칙 확인 ==="
gcloud compute firewall-rules list --filter="name~allow-http OR name~default-allow-http" --format="table(name,allowed[].map().firewall_rule().list():label=ALLOW,direction,priority)"
echo ""

echo "=== HTTP 방화벽 규칙 생성 ==="
echo "다음 명령어를 실행하세요:"
echo "gcloud compute firewall-rules create allow-http --allow tcp:80 --source-ranges 0.0.0.0/0 --description 'Allow HTTP traffic'"
```

## 확인 사항 체크리스트

- [ ] GCP 방화벽 규칙에서 포트 80이 열려있음
- [ ] Nginx가 0.0.0.0:80으로 리스닝 중
- [ ] DNS가 서버 IP로 올바르게 설정됨
- [ ] 서버의 외부 IP 확인됨
- [ ] UFW가 포트 80을 허용함 (필요시)

## 추가 확인

### GCP 콘솔에서 확인할 사항

1. **인스턴스 페이지**
   - https://console.cloud.google.com/compute/instances
   - 인스턴스 선택 > 네트워크 탭
   - 외부 IP 확인

2. **방화벽 규칙 페이지**
   - https://console.cloud.google.com/networking/firewalls
   - HTTP 트래픽 허용 규칙 확인

3. **VPC 네트워크 페이지**
   - https://console.cloud.google.com/networking/networks
   - 네트워크 설정 확인

