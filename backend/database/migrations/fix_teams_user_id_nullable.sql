-- teams 테이블의 user_id를 NULL 허용으로 변경 (AI 팀을 위해)
-- 이미 NULL 허용이면 에러 무시

SET @col_nullable = 0;
SELECT COUNT(*) INTO @col_nullable 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'teams' 
  AND COLUMN_NAME = 'user_id'
  AND IS_NULLABLE = 'YES';

SET @sql = IF(@col_nullable = 0,
  'ALTER TABLE teams MODIFY COLUMN user_id INT NULL',
  'SELECT ''Column user_id is already nullable'' AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

