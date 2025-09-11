-- Clear supplier data and enforce uniqueness (school_id, name)

SET FOREIGN_KEY_CHECKS=0;

-- 1) Clear certificates table if exists
DROP TEMPORARY TABLE IF EXISTS _noop;
SET @has_tbl := (
  SELECT COUNT(1) FROM information_schema.tables
   WHERE table_schema = DATABASE() AND table_name = 'supplier_certificates'
);
SET @stmt := (
  SELECT IF(@has_tbl = 1, 'DELETE FROM supplier_certificates', 'SELECT 1')
);
PREPARE s1 FROM @stmt; EXECUTE s1; DEALLOCATE PREPARE s1;

-- 2) Null supplier references in inbound records (defensive)
DROP TEMPORARY TABLE IF EXISTS _noop2;
SET @has_inb := (
  SELECT COUNT(1) FROM information_schema.tables
   WHERE table_schema = DATABASE() AND table_name = 'inv_inbound'
);
SET @stmt := (
  SELECT IF(@has_inb = 1, 'UPDATE inv_inbound SET supplier_id = NULL WHERE supplier_id IS NOT NULL', 'SELECT 1')
);
PREPARE s2 FROM @stmt; EXECUTE s2; DEALLOCATE PREPARE s2;

-- 3) Clear suppliers
DROP TEMPORARY TABLE IF EXISTS _noop3;
SET @has_sup := (
  SELECT COUNT(1) FROM information_schema.tables
   WHERE table_schema = DATABASE() AND table_name = 'inv_suppliers'
);
SET @stmt := (
  SELECT IF(@has_sup = 1, 'TRUNCATE TABLE inv_suppliers', 'SELECT 1')
);
PREPARE s3 FROM @stmt; EXECUTE s3; DEALLOCATE PREPARE s3;

-- 4) Enforce unique index on (school_id, name)
SET @has_idx := (
  SELECT COUNT(1) FROM information_schema.statistics
   WHERE table_schema = DATABASE() AND table_name = 'inv_suppliers' AND index_name = 'uk_inv_suppliers_school_name'
);
SET @stmt := (
  SELECT IF(@has_idx = 0,
    'ALTER TABLE inv_suppliers ADD UNIQUE KEY uk_inv_suppliers_school_name (school_id, name)',
    'SELECT 1')
);
PREPARE s4 FROM @stmt; EXECUTE s4; DEALLOCATE PREPARE s4;

SET FOREIGN_KEY_CHECKS=1;

