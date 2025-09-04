-- Optional remark for roles (compatible with MySQL 5.7/8.0)
set @has_remark := (
  select count(1) from information_schema.columns
   where table_schema = database() and table_name = 'roles' and column_name = 'remark'
);
set @sql := if(@has_remark = 0, 'alter table roles add column remark varchar(255) null after name', 'select 1');
prepare stmt from @sql; execute stmt; deallocate prepare stmt;
