-- School staff table for personnel management

create table if not exists school_staff (
  id int primary key auto_increment,
  school_id int not null,
  name varchar(128) not null,
  job_title varchar(128) null,
  phone varchar(32) null,
  health_cert_no varchar(64) null,
  enabled tinyint not null default 1,
  created_at datetime not null default current_timestamp,
  key idx_staff_school (school_id),
  key idx_staff_name (name),
  key idx_staff_phone (phone)
);

