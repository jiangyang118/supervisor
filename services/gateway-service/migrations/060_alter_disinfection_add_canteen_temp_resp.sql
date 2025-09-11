-- Add canteen_id, temperature_c, responsible columns if missing
SET @has_cid := (
  SELECT COUNT(1) FROM information_schema.columns
   WHERE table_schema = DATABASE() AND table_name = 'disinfection_records' AND column_name = 'canteen_id'
);
SET @stmt := (SELECT IF(@has_cid = 0,
  'ALTER TABLE disinfection_records ADD COLUMN canteen_id bigint unsigned NULL AFTER school_id',
  'SELECT 1'));
PREPARE s1 FROM @stmt; EXECUTE s1; DEALLOCATE PREPARE s1;

SET @has_temp := (
  SELECT COUNT(1) FROM information_schema.columns
   WHERE table_schema = DATABASE() AND table_name = 'disinfection_records' AND column_name = 'temperature_c'
);
SET @stmt := (SELECT IF(@has_temp = 0,
  'ALTER TABLE disinfection_records ADD COLUMN temperature_c decimal(6,2) NULL AFTER items',
  'SELECT 1'));
PREPARE s2 FROM @stmt; EXECUTE s2; DEALLOCATE PREPARE s2;

SET @has_resp := (
  SELECT COUNT(1) FROM information_schema.columns
   WHERE table_schema = DATABASE() AND table_name = 'disinfection_records' AND column_name = 'responsible'
);
SET @stmt := (SELECT IF(@has_resp = 0,
  'ALTER TABLE disinfection_records ADD COLUMN responsible varchar(128) NULL AFTER temperature_c',
  'SELECT 1'));
PREPARE s3 FROM @stmt; EXECUTE s3; DEALLOCATE PREPARE s3;
