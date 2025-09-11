-- Drop supplier qualifications and clear related data

SET FOREIGN_KEY_CHECKS=0;

-- 1) Nullify supplier references in inbound records to avoid dangling refs
DROP TEMPORARY TABLE IF EXISTS _noop_inb;
SET @has_inb := (
  SELECT COUNT(1) FROM information_schema.tables
   WHERE table_schema = DATABASE() AND table_name = 'inv_inbound'
);
SET @stmt := (
  SELECT IF(@has_inb = 1, 'UPDATE inv_inbound SET supplier_id = NULL WHERE supplier_id IS NOT NULL', 'SELECT 1')
);
PREPARE s_inb FROM @stmt; EXECUTE s_inb; DEALLOCATE PREPARE s_inb;

-- 2) Drop supplier certificates table if exists
DROP TABLE IF EXISTS supplier_certificates;

-- 3) Clear suppliers table
TRUNCATE TABLE inv_suppliers;

SET FOREIGN_KEY_CHECKS=1;

