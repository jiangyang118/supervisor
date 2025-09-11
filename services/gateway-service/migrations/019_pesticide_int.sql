-- Ensure pesticide_records exists and uses BIGINT UNSIGNED ids

create table if not exists pesticide_records (
  id bigint unsigned primary key auto_increment,
  school_id bigint unsigned not null,
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

-- Align columns to BIGINT UNSIGNED
ALTER TABLE pesticide_records
  MODIFY COLUMN id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  MODIFY COLUMN school_id BIGINT UNSIGNED NOT NULL;
