-- Dine records table

create table if not exists dine_records (
  id int primary key auto_increment,
  school_id int not null,
  meal_key varchar(32) not null,
  meal varchar(16) not null,
  people text null,
  image_url varchar(255) null,
  comment varchar(255) null,
  at datetime not null,
  source varchar(16) not null,
  exception tinyint not null default 0,
  exception_reason varchar(255) null,
  measure varchar(255) null,
  key idx_dr_school_at (school_id, at),
  key idx_dr_meal (meal_key),
  key idx_dr_exception (exception)
);

