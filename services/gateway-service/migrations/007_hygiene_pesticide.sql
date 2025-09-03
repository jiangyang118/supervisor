-- Hygiene inspections
create table if not exists hygiene_inspections (
  id bigint primary key auto_increment,
  school_id bigint not null,
  date datetime not null,
  result varchar(8) not null,
  created_by varchar(128) not null,
  remark varchar(255) null,
  key idx_hygiene_school_date (school_id, date),
  key idx_hygiene_result_date (result, date)
);

-- Asset maintenance
create table if not exists asset_maintenance (
  id bigint primary key auto_increment,
  school_id bigint not null,
  asset varchar(255) not null,
  date datetime not null,
  action varchar(255) not null,
  created_by varchar(128) not null,
  key idx_asset_school_date (school_id, date),
  key idx_asset_name_date (asset, date)
);

-- Pesticide records
create table if not exists pesticide_records (
  id bigint primary key auto_increment,
  school_id bigint not null,
  sample varchar(255) not null,
  device varchar(128) not null,
  result varchar(8) not null,
  image_url varchar(255) null,
  remark varchar(255) null,
  at datetime not null,
  source varchar(16) not null,
  exception tinyint not null default 0,
  measure varchar(255) null,
  key idx_pest_school_at (school_id, at),
  key idx_pest_result_at (result, at)
);
