-- Add detect_value column for pesticide records if missing
SET @has_val := (
  SELECT COUNT(1) FROM information_schema.columns
   WHERE table_schema = DATABASE() AND table_name = 'pesticide_records' AND column_name = 'detect_value'
);
SET @stmt := (SELECT IF(@has_val = 0,
  'ALTER TABLE pesticide_records ADD COLUMN detect_value decimal(18,3) NULL AFTER tester',
  'SELECT 1'));
PREPARE s1 FROM @stmt; EXECUTE s1; DEALLOCATE PREPARE s1;

