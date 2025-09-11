-- Align sampling table IDs to BIGINT UNSIGNED AUTO_INCREMENT and fix FK types
-- Also align FK columns to BIGINT UNSIGNED for consistency with schools.id

SET FOREIGN_KEY_CHECKS=0;

-- Drop existing foreign keys if present (guarded)
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

SET @stmt := (SELECT IF(EXISTS(
  SELECT 1 FROM information_schema.table_constraints
  WHERE table_schema = DATABASE() AND table_name = 'sampling_records'
    AND constraint_type = 'FOREIGN KEY' AND constraint_name = 'fk_sr_school'
), 'ALTER TABLE sampling_records DROP FOREIGN KEY fk_sr_school', 'SELECT 1'));
PREPARE s3 FROM @stmt; EXECUTE s3; DEALLOCATE PREPARE s3;

-- Adjust primary key types to INT AUTO_INCREMENT
ALTER TABLE sampling_records
  MODIFY COLUMN id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT;

ALTER TABLE sampling_cleanups
  MODIFY COLUMN id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT;

-- Align FK column types to BIGINT UNSIGNED
ALTER TABLE sampling_records
  MODIFY COLUMN school_id BIGINT UNSIGNED NOT NULL;

ALTER TABLE sampling_cleanups
  MODIFY COLUMN school_id BIGINT UNSIGNED NOT NULL,
  MODIFY COLUMN sample_id BIGINT UNSIGNED NULL;

-- Recreate foreign keys (guarded)
SET @stmt := (SELECT IF(NOT EXISTS(
  SELECT 1 FROM information_schema.table_constraints
  WHERE table_schema = DATABASE() AND table_name = 'sampling_records'
    AND constraint_name = 'fk_sr_school'
), 'ALTER TABLE sampling_records ADD CONSTRAINT fk_sr_school FOREIGN KEY (school_id) REFERENCES schools(id) ON UPDATE CASCADE ON DELETE RESTRICT', 'SELECT 1'));
PREPARE s4 FROM @stmt; EXECUTE s4; DEALLOCATE PREPARE s4;

SET @stmt := (SELECT IF(NOT EXISTS(
  SELECT 1 FROM information_schema.table_constraints
  WHERE table_schema = DATABASE() AND table_name = 'sampling_cleanups'
    AND constraint_name = 'fk_sc_school'
), 'ALTER TABLE sampling_cleanups ADD CONSTRAINT fk_sc_school FOREIGN KEY (school_id) REFERENCES schools(id) ON UPDATE CASCADE ON DELETE RESTRICT', 'SELECT 1'));
PREPARE s5 FROM @stmt; EXECUTE s5; DEALLOCATE PREPARE s5;

SET @stmt := (SELECT IF(NOT EXISTS(
  SELECT 1 FROM information_schema.table_constraints
  WHERE table_schema = DATABASE() AND table_name = 'sampling_cleanups'
    AND constraint_name = 'fk_sc_sample'
), 'ALTER TABLE sampling_cleanups ADD CONSTRAINT fk_sc_sample FOREIGN KEY (sample_id) REFERENCES sampling_records(id) ON UPDATE CASCADE ON DELETE SET NULL', 'SELECT 1'));
PREPARE s6 FROM @stmt; EXECUTE s6; DEALLOCATE PREPARE s6;

SET FOREIGN_KEY_CHECKS=1;
