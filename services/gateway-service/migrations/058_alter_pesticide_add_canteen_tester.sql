-- Add canteen_id and tester columns for pesticide records if missing
SET @has_cid := (
  SELECT COUNT(1) FROM information_schema.columns
   WHERE table_schema = DATABASE() AND table_name = 'pesticide_records' AND column_name = 'canteen_id'
);
SET @stmt := (SELECT IF(@has_cid = 0,
  'ALTER TABLE pesticide_records ADD COLUMN canteen_id int NULL AFTER school_id',
  'SELECT 1'));
PREPARE s1 FROM @stmt; EXECUTE s1; DEALLOCATE PREPARE s1;

SET @has_tester := (
  SELECT COUNT(1) FROM information_schema.columns
   WHERE table_schema = DATABASE() AND table_name = 'pesticide_records' AND column_name = 'tester'
);
SET @stmt := (SELECT IF(@has_tester = 0,
  'ALTER TABLE pesticide_records ADD COLUMN tester varchar(128) NULL AFTER device',
  'SELECT 1'));
PREPARE s2 FROM @stmt; EXECUTE s2; DEALLOCATE PREPARE s2;

