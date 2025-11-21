-- teams 테이블의 user_id를 NULL 허용으로 변경 (AI 팀을 위해)
ALTER TABLE teams MODIFY COLUMN user_id INT NULL;

