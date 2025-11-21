-- 선수 테이블에 나이 및 은퇴 정보 컬럼 추가
-- 이미 존재하는 경우 오류가 발생할 수 있으므로, 필요시 수동으로 실행

-- 컬럼 존재 여부 확인 후 추가 (MariaDB에서는 직접 지원하지 않으므로 주의)
ALTER TABLE players 
ADD COLUMN age INT DEFAULT 18,
ADD COLUMN retirement_date DATE,
ADD COLUMN stat_decline_rate DECIMAL(5,2) DEFAULT 0;

