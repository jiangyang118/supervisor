-- Extend roles with school_id and timestamps; adjust uniqueness (MySQL 5.7 compatible)

-- school_id
set @has_school := (
  select count(1) from information_schema.columns
   where table_schema = database() and table_name = 'roles' and column_name = 'school_id'
);
set @sql := if(@has_school = 0, 'alter table roles add column school_id bigint unsigned not null default 1 after id', 'select 1');
prepare stmt from @sql; execute stmt; deallocate prepare stmt;

-- created_at
set @has_created := (
  select count(1) from information_schema.columns
   where table_schema = database() and table_name = 'roles' and column_name = 'created_at'
);
set @sql := if(@has_created = 0, 'alter table roles add column created_at datetime not null default current_timestamp', 'select 1');
prepare stmt from @sql; execute stmt; deallocate prepare stmt;

-- updated_at
set @has_updated := (
  select count(1) from information_schema.columns
   where table_schema = database() and table_name = 'roles' and column_name = 'updated_at'
);
set @sql := if(@has_updated = 0, 'alter table roles add column updated_at datetime not null default current_timestamp on update current_timestamp', 'select 1');
prepare stmt from @sql; execute stmt; deallocate prepare stmt;

-- Drop old unique on name (created implicitly by 'unique') and add composite unique
-- Note: index name for UNIQUE(name) is usually 'name'
set @has_name_idx := (
  select count(1) from information_schema.statistics
   where table_schema = database() and table_name = 'roles' and index_name = 'name'
);
set @sql := if(@has_name_idx > 0, 'alter table roles drop index name', 'select 1');
prepare stmt from @sql; execute stmt; deallocate prepare stmt;

-- add composite unique if missing
set @has_uk := (
  select count(1) from information_schema.statistics
   where table_schema = database() and table_name = 'roles' and index_name = 'uk_roles_school_name'
);
set @sql := if(@has_uk = 0, 'alter table roles add unique key uk_roles_school_name (school_id, name)', 'select 1');
prepare stmt from @sql; execute stmt; deallocate prepare stmt;
