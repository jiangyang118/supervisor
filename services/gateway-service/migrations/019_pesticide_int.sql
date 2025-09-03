-- Ensure pesticide_records exists and uses INT ids

create table if not exists pesticide_records (
  id int primary key auto_increment,
  school_id int not null,
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

-- If table exists with BIGINT, align to INT
ALTER TABLE pesticide_records
  MODIFY COLUMN id INT NOT NULL AUTO_INCREMENT,
  MODIFY COLUMN school_id INT NOT NULL;

