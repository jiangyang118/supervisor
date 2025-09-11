-- Disinfection records table

create table if not exists disinfection_records (
  id bigint unsigned primary key auto_increment,
  school_id bigint unsigned not null,
  method varchar(16) not null,
  duration_minutes bigint unsigned not null,
  items varchar(255) not null,
  image_url varchar(255) null,
  at datetime not null,
  source varchar(16) not null,
  exception tinyint not null default 0,
  exception_reason varchar(255) null,
  measure varchar(255) null,
  key idx_df_school_at (school_id, at),
  key idx_df_method (method),
  key idx_df_exception (exception)
);
