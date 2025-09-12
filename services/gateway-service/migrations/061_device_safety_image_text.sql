-- Ensure device_safety_checks.image_url can store large data URLs
-- Change image_url from varchar(512) to TEXT if needed

set @has_table := (
  select count(*) from information_schema.tables
   where table_schema = database() and table_name = 'device_safety_checks'
);

set @sql := if(@has_table = 1, 'alter table device_safety_checks modify column image_url text null', 'select 1');
prepare stmt from @sql; execute stmt; deallocate prepare stmt;

