create table if not exists morning_checks (
  id bigint unsigned primary key auto_increment,
  equipment_code varchar(128) not null,
  user_id varchar(128) not null,
  check_time datetime not null,
  forehead_temp decimal(4,1) not null,
  normal_temperature_min decimal(4,1) not null,
  normal_temperature_max decimal(4,1) not null,
  abnormal_temp tinyint not null,
  hand_check_result json null,
  health_ask_result json null,
  health tinyint not null,
  images json null,
  raw json null,
  created_at datetime not null default current_timestamp
);

-- avoid DESC to maximize MySQL compatibility
create index idx_morning_checks_time on morning_checks(check_time);
create index idx_morning_checks_user on morning_checks(user_id);
create index idx_morning_checks_equipment on morning_checks(equipment_code);
