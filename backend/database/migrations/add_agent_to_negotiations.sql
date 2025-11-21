-- 협상 테이블에 에이전트 컬럼 추가
-- 이미 존재하는 경우 오류가 발생할 수 있으므로, 필요시 수동으로 실행

ALTER TABLE negotiations
ADD COLUMN agent_id INT;

-- 외래 키 추가 (agents 테이블이 존재하는 경우에만)
ALTER TABLE negotiations
ADD FOREIGN KEY fk_agent (agent_id) REFERENCES agents(id) ON DELETE SET NULL;

