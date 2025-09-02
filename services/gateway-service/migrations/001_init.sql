create table if not exists regulator_morning_checks (
  id varchar(128) primary key,
  school_id varchar(128) null,
  school_name varchar(255) null,
  payload json not null,
  received_at datetime not null default current_timestamp
);
