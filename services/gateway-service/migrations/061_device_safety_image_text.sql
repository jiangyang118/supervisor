
-- Follow the same SELECT IF + PREPARE pattern as 060_*.sql for compatibility
SET @has_col := (
  SELECT COUNT(1) FROM information_schema.columns
   WHERE table_schema = DATABASE()
     AND table_name = 'device_safety_checks'
     AND column_name = 'image_url'
);

-- Only modify when column exists and is not already TEXT
SET @is_text := (
  SELECT COUNT(1) FROM information_schema.columns
   WHERE table_schema = DATABASE()
     AND table_name = 'device_safety_checks'
     AND column_name = 'image_url'
     AND data_type = 'text'
);

SET @stmt := (
  SELECT IF(@has_col = 1 AND @is_text = 0,
    'ALTER TABLE device_safety_checks MODIFY COLUMN image_url TEXT NULL',
    'SELECT 1')
);
PREPARE s1 FROM @stmt; EXECUTE s1; DEALLOCATE PREPARE s1;
