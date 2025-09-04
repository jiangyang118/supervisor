create table if not exists regulator_morning_checks (
  id int(20) primary key auto_increment,
  school_id int(20) null,
  school_name varchar(255) null,
  payload json not null,
  received_at datetime not null default current_timestamp
);
