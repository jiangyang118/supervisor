-- Convert public_feedback id to BIGINT UNSIGNED AUTO_INCREMENT and school_id to BIGINT UNSIGNED
SET FOREIGN_KEY_CHECKS=0;

-- Adjust column types
ALTER TABLE public_feedback
  MODIFY COLUMN id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  MODIFY COLUMN school_id BIGINT UNSIGNED NOT NULL;

-- Add FK to schools(id) if not exists
SET @stmt := (
  SELECT IF(NOT EXISTS(
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = DATABASE() AND table_name = 'public_feedback'
      AND constraint_type = 'FOREIGN KEY' AND constraint_name = 'fk_pf_school'
  ),
  'ALTER TABLE public_feedback ADD CONSTRAINT fk_pf_school FOREIGN KEY (school_id) REFERENCES schools(id) ON UPDATE CASCADE ON DELETE RESTRICT',
  'SELECT 1')
);
PREPARE s1 FROM @stmt; EXECUTE s1; DEALLOCATE PREPARE s1;

-- Helpful indexes
ALTER TABLE public_feedback
  ADD INDEX idx_pf_school_at (school_id, at),
  ADD INDEX idx_pf_status (status);

SET FOREIGN_KEY_CHECKS=1;
