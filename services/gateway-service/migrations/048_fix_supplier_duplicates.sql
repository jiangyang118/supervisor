-- De-duplicate supplier names per (school_id, name) before adding unique index

-- Strategy:
--  - Keep the smallest id in each (school_id, name) group unchanged
--  - Rename others by appending " (id)" to make names unique

-- Rename duplicates (applies to all rows, deleted/active alike)
UPDATE inv_suppliers s
JOIN inv_suppliers s2
  ON s.school_id = s2.school_id
 AND s.name = s2.name
 AND s.id > s2.id
SET s.name = CONCAT(s.name, ' (', s.id, ')');

-- Add unique index after de-duplication (idempotent)
SET @has_idx := (
  SELECT COUNT(1) FROM information_schema.statistics
   WHERE table_schema = DATABASE() AND table_name = 'inv_suppliers' AND index_name = 'uk_inv_suppliers_school_name'
);
SET @stmt := (
  SELECT IF(@has_idx = 0,
    'ALTER TABLE inv_suppliers ADD UNIQUE KEY uk_inv_suppliers_school_name (school_id, name)',
    'SELECT 1')
);
PREPARE s1 FROM @stmt; EXECUTE s1; DEALLOCATE PREPARE s1;

