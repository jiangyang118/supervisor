-- Add code and enabled columns to canteens table if missing
SET @has_code := (
  SELECT COUNT(1) FROM information_schema.columns
   WHERE table_schema = DATABASE() AND table_name = 'canteens' AND column_name = 'code'
);
SET @stmt := (SELECT IF(@has_code = 0,
  'ALTER TABLE canteens ADD COLUMN code varchar(64) NULL AFTER name',
  'SELECT 1'));
PREPARE s1 FROM @stmt; EXECUTE s1; DEALLOCATE PREPARE s1;

SET @has_enabled := (
  SELECT COUNT(1) FROM information_schema.columns
   WHERE table_schema = DATABASE() AND table_name = 'canteens' AND column_name = 'enabled'
);
SET @stmt := (SELECT IF(@has_enabled = 0,
  'ALTER TABLE canteens ADD COLUMN enabled tinyint not null default 1 AFTER phone',
  'SELECT 1'));
PREPARE s2 FROM @stmt; EXECUTE s2; DEALLOCATE PREPARE s2;

-- Add index for (school_id, code) to ease lookup and ensure uniqueness if needed at app level
SET @has_idx_code := (
  SELECT COUNT(1) FROM information_schema.statistics
   WHERE table_schema = DATABASE() AND table_name = 'canteens' AND index_name = 'idx_canteen_school_code'
);
SET @stmt := (SELECT IF(@has_idx_code = 0,
  'CREATE INDEX idx_canteen_school_code ON canteens(school_id, code)',
  'SELECT 1'));
PREPARE s3 FROM @stmt; EXECUTE s3; DEALLOCATE PREPARE s3;

