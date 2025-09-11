-- Fix waste_records.id to be BIGINT UNSIGNED AUTO_INCREMENT if schema drifted (e.g., VARCHAR PK '')

SET FOREIGN_KEY_CHECKS=0;

-- Only run fix when id column is not BIGINT
SET @needs_fix := (
  SELECT IF(EXISTS(
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'waste_records' AND column_name = 'id' AND data_type <> 'bigint'
  ), 1, 0)
);

-- Step 1: create new table if needed
SET @stmt := (
  SELECT IF(@needs_fix = 1,
    'CREATE TABLE IF NOT EXISTS waste_records_new (
       id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
       school_id BIGINT UNSIGNED NOT NULL,
       date DATE NOT NULL,
       category VARCHAR(255) NOT NULL,
       amount DECIMAL(18,3) NOT NULL DEFAULT 0,
       buyer VARCHAR(255) NOT NULL,
       person VARCHAR(255) NOT NULL,
       created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
       KEY idx_waste_records_school_date (school_id, date),
       KEY idx_waste_records_category (category),
       KEY idx_waste_records_created_at (created_at)
     )',
    'SELECT 1')
);
PREPARE s1 FROM @stmt; EXECUTE s1; DEALLOCATE PREPARE s1;

-- Step 2: truncate target table (idempotent safety)
SET @stmt := (SELECT IF(@needs_fix = 1, 'TRUNCATE TABLE waste_records_new', 'SELECT 1'));
PREPARE s2 FROM @stmt; EXECUTE s2; DEALLOCATE PREPARE s2;

-- Step 3: copy data
SET @stmt := (
  SELECT IF(@needs_fix = 1,
    'INSERT INTO waste_records_new(school_id, date, category, amount, buyer, person, created_at)
       SELECT school_id, date, category, amount, buyer, person, created_at FROM waste_records',
    'SELECT 1')
);
PREPARE s3 FROM @stmt; EXECUTE s3; DEALLOCATE PREPARE s3;

-- Step 4: swap tables
SET @stmt := (
  SELECT IF(@needs_fix = 1,
    'RENAME TABLE waste_records TO waste_records_old, waste_records_new TO waste_records',
    'SELECT 1')
);
PREPARE s4 FROM @stmt; EXECUTE s4; DEALLOCATE PREPARE s4;

-- Step 5: drop old table
SET @stmt := (SELECT IF(@needs_fix = 1, 'DROP TABLE IF EXISTS waste_records_old', 'SELECT 1'));
PREPARE s5 FROM @stmt; EXECUTE s5; DEALLOCATE PREPARE s5;

-- Ensure id and school_id types are BIGINT UNSIGNED (idempotent)
ALTER TABLE waste_records
  MODIFY COLUMN id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  MODIFY COLUMN school_id BIGINT UNSIGNED NOT NULL;

SET FOREIGN_KEY_CHECKS=1;
