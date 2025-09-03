-- Robustly fix sampling_cleanups primary key/type to INT AUTO_INCREMENT
-- Use dynamic SQL to drop/add FKs only when they exist/missing

SET FOREIGN_KEY_CHECKS=0;

-- Drop FKs if they exist
SET @stmt := (SELECT IF(EXISTS(
  SELECT 1 FROM information_schema.table_constraints
  WHERE table_schema = DATABASE() AND table_name = 'sampling_cleanups'
    AND constraint_type = 'FOREIGN KEY' AND constraint_name = 'fk_sc_sample'
), 'ALTER TABLE sampling_cleanups DROP FOREIGN KEY fk_sc_sample', 'SELECT 1'));
PREPARE s1 FROM @stmt; EXECUTE s1; DEALLOCATE PREPARE s1;

SET @stmt := (SELECT IF(EXISTS(
  SELECT 1 FROM information_schema.table_constraints
  WHERE table_schema = DATABASE() AND table_name = 'sampling_cleanups'
    AND constraint_type = 'FOREIGN KEY' AND constraint_name = 'fk_sc_school'
), 'ALTER TABLE sampling_cleanups DROP FOREIGN KEY fk_sc_school', 'SELECT 1'));
PREPARE s2 FROM @stmt; EXECUTE s2; DEALLOCATE PREPARE s2;

-- Normalize bad values before type changes
UPDATE sampling_cleanups SET sample_id = NULL WHERE sample_id = '' OR sample_id = 0;

-- Ensure PK and FK column types are INT and auto-increment
ALTER TABLE sampling_cleanups
  MODIFY COLUMN id INT NOT NULL AUTO_INCREMENT,
  MODIFY COLUMN school_id INT NOT NULL,
  MODIFY COLUMN sample_id INT NULL;

-- Recreate FKs if missing
SET @stmt := (SELECT IF(NOT EXISTS(
  SELECT 1 FROM information_schema.table_constraints
  WHERE table_schema = DATABASE() AND table_name = 'sampling_cleanups'
    AND constraint_name = 'fk_sc_school'
), 'ALTER TABLE sampling_cleanups ADD CONSTRAINT fk_sc_school FOREIGN KEY (school_id) REFERENCES schools(id) ON UPDATE CASCADE ON DELETE RESTRICT', 'SELECT 1'));
PREPARE s3 FROM @stmt; EXECUTE s3; DEALLOCATE PREPARE s3;

SET @stmt := (SELECT IF(NOT EXISTS(
  SELECT 1 FROM information_schema.table_constraints
  WHERE table_schema = DATABASE() AND table_name = 'sampling_cleanups'
    AND constraint_name = 'fk_sc_sample'
), 'ALTER TABLE sampling_cleanups ADD CONSTRAINT fk_sc_sample FOREIGN KEY (sample_id) REFERENCES sampling_records(id) ON UPDATE CASCADE ON DELETE SET NULL', 'SELECT 1'));
PREPARE s4 FROM @stmt; EXECUTE s4; DEALLOCATE PREPARE s4;

SET FOREIGN_KEY_CHECKS=1;

