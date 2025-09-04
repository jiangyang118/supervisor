create table if not exists school_morning_checks (
  id int(20) primary key auto_increment,
  school_id int(20) not null,
  staff varchar(128) not null,
  temp decimal(4,1) not null,
  result varchar(8) not null,
  at datetime not null,
  source varchar(16) not null,
  reported tinyint not null default 1,
  measure varchar(255) null,
  key idx_smc_school_time (school_id, at),
  key idx_smc_result_time (result, at)
);
