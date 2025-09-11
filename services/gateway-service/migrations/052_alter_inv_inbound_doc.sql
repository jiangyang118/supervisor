-- MySQL-compatible migration to add inv_inbound doc-level columns and indexes
-- This script replaces the previous non-compatible IF NOT EXISTS syntax

-- Add doc_no
SET @has_doc_no := (
  SELECT COUNT(1) FROM information_schema.columns
   WHERE table_schema = DATABASE() AND table_name = 'inv_inbound' AND column_name = 'doc_no'
);
SET @stmt := (SELECT IF(@has_doc_no = 0,
  'ALTER TABLE inv_inbound ADD COLUMN doc_no varchar(64) NULL AFTER id',
  'SELECT 1'));
PREPARE s1 FROM @stmt; EXECUTE s1; DEALLOCATE PREPARE s1;

-- Add canteen_id
SET @has_cid := (
  SELECT COUNT(1) FROM information_schema.columns
   WHERE table_schema = DATABASE() AND table_name = 'inv_inbound' AND column_name = 'canteen_id'
);
SET @stmt := (SELECT IF(@has_cid = 0,
  'ALTER TABLE inv_inbound ADD COLUMN canteen_id bigint unsigned NULL AFTER school_id',
  'SELECT 1'));
PREPARE s2 FROM @stmt; EXECUTE s2; DEALLOCATE PREPARE s2;

-- Add unit_price
SET @has_uprice := (
  SELECT COUNT(1) FROM information_schema.columns
   WHERE table_schema = DATABASE() AND table_name = 'inv_inbound' AND column_name = 'unit_price'
);
SET @stmt := (SELECT IF(@has_uprice = 0,
  'ALTER TABLE inv_inbound ADD COLUMN unit_price decimal(18,2) NULL AFTER qty',
  'SELECT 1'));
PREPARE s3 FROM @stmt; EXECUTE s3; DEALLOCATE PREPARE s3;

-- Add prod_date
SET @has_pdate := (
  SELECT COUNT(1) FROM information_schema.columns
   WHERE table_schema = DATABASE() AND table_name = 'inv_inbound' AND column_name = 'prod_date'
);
SET @stmt := (SELECT IF(@has_pdate = 0,
  'ALTER TABLE inv_inbound ADD COLUMN prod_date date NULL AFTER unit_price',
  'SELECT 1'));
PREPARE s4 FROM @stmt; EXECUTE s4; DEALLOCATE PREPARE s4;

-- Add shelf_life_days
SET @has_shelf := (
  SELECT COUNT(1) FROM information_schema.columns
   WHERE table_schema = DATABASE() AND table_name = 'inv_inbound' AND column_name = 'shelf_life_days'
);
SET @stmt := (SELECT IF(@has_shelf = 0,
  'ALTER TABLE inv_inbound ADD COLUMN shelf_life_days bigint unsigned NULL AFTER prod_date',
  'SELECT 1'));
PREPARE s5 FROM @stmt; EXECUTE s5; DEALLOCATE PREPARE s5;

-- Add created_by
SET @has_cby := (
  SELECT COUNT(1) FROM information_schema.columns
   WHERE table_schema = DATABASE() AND table_name = 'inv_inbound' AND column_name = 'created_by'
);
SET @stmt := (SELECT IF(@has_cby = 0,
  'ALTER TABLE inv_inbound ADD COLUMN created_by varchar(255) NULL AFTER source',
  'SELECT 1'));
PREPARE s6 FROM @stmt; EXECUTE s6; DEALLOCATE PREPARE s6;

-- Add index idx_inv_in_doc on (doc_no)
SET @has_idx_doc := (
  SELECT COUNT(1) FROM information_schema.statistics
   WHERE table_schema = DATABASE() AND table_name = 'inv_inbound' AND index_name = 'idx_inv_in_doc'
);
SET @stmt := (SELECT IF(@has_idx_doc = 0,
  'CREATE INDEX idx_inv_in_doc ON inv_inbound(doc_no)',
  'SELECT 1'));
PREPARE s7 FROM @stmt; EXECUTE s7; DEALLOCATE PREPARE s7;

-- Add index idx_inv_in_at on (at)
SET @has_idx_at := (
  SELECT COUNT(1) FROM information_schema.statistics
   WHERE table_schema = DATABASE() AND table_name = 'inv_inbound' AND index_name = 'idx_inv_in_at'
);
SET @stmt := (SELECT IF(@has_idx_at = 0,
  'CREATE INDEX idx_inv_in_at ON inv_inbound(at)',
  'SELECT 1'));
PREPARE s8 FROM @stmt; EXECUTE s8; DEALLOCATE PREPARE s8;
