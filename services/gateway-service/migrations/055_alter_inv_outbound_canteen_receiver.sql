-- Alter inv_outbound to add canteen_id and receiver, if missing

-- Add canteen_id
SET @has_cid := (
  SELECT COUNT(1) FROM information_schema.columns
   WHERE table_schema = DATABASE() AND table_name = 'inv_outbound' AND column_name = 'canteen_id'
);
SET @stmt := (SELECT IF(@has_cid = 0,
  'ALTER TABLE inv_outbound ADD COLUMN canteen_id bigint unsigned NULL AFTER school_id',
  'SELECT 1'));
PREPARE s1 FROM @stmt; EXECUTE s1; DEALLOCATE PREPARE s1;

-- Add receiver
SET @has_recv := (
  SELECT COUNT(1) FROM information_schema.columns
   WHERE table_schema = DATABASE() AND table_name = 'inv_outbound' AND column_name = 'receiver'
);
SET @stmt := (SELECT IF(@has_recv = 0,
  'ALTER TABLE inv_outbound ADD COLUMN receiver varchar(128) NULL AFTER by_who',
  'SELECT 1'));
PREPARE s2 FROM @stmt; EXECUTE s2; DEALLOCATE PREPARE s2;
