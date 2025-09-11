-- -- Ensure unique supplier name per school

-- SET @has_idx := (
--   SELECT COUNT(1) FROM information_schema.statistics
--    WHERE table_schema = DATABASE() AND table_name = 'inv_suppliers' AND index_name = 'uk_inv_suppliers_school_name'
-- );
-- SET @stmt := (
--   SELECT IF(@has_idx = 0,
--     'ALTER TABLE inv_suppliers ADD UNIQUE KEY uk_inv_suppliers_school_name (school_id, name)',
--     'SELECT 1')
-- );
-- PREPARE s1 FROM @stmt; EXECUTE s1; DEALLOCATE PREPARE s1;

