-- Sampling domain tables

create table if not exists sampling_records (
  id int primary key auto_increment,
  school_id int not null,
  sample varchar(255) not null,
  weight decimal(10,2) not null,
  image_url varchar(255) null,
  duration_hours int not null,
  by_who varchar(128) not null,
  cabinet varchar(64) null,
  at datetime not null,
  status varchar(16) not null,
  source varchar(16) not null,
  exception tinyint not null default 0,
  exception_reason varchar(255) null,
  measure varchar(255) null,
  key idx_sr_school_at (school_id, at),
  key idx_sr_status (status),
  key idx_sr_exception (exception)
);

create table if not exists sampling_cleanups (
  id int primary key auto_increment,
  school_id int not null,
  sample_id bigint null,
  sample varchar(255) not null,
  weight decimal(10,2) not null,
  image_url varchar(255) null,
  method varchar(64) not null,
  by_who varchar(128) not null,
  at datetime not null,
  source varchar(16) not null,
  key idx_sc_school_at (school_id, at),
  key idx_sc_sample (sample_id)
);
