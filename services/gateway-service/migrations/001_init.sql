create table if not exists regulator_morning_checks (
  id bigint unsigned primary key auto_increment,
  school_id bigint unsigned null,
  school_name varchar(255) null,
  payload json not null,
  received_at datetime not null default current_timestamp
);
