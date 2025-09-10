-- Table: school_personnel (personnel with health certificates)
create table if not exists school_personnel (
  id int primary key auto_increment,
  school_id int not null,
  canteen_id int null,
  name varchar(128) not null,
  gender varchar(8) null,
  phone varchar(32) null,
  job_title varchar(128) null,
  health_cert_no varchar(128) null,
  health_cert_authority varchar(255) null,
  health_cert_issue_at datetime null,
  health_cert_expire_at datetime null,
  health_cert_front_url varchar(1024) null,
  health_cert_back_url varchar(1024) null,
  enabled tinyint not null default 1,
  created_at datetime not null default current_timestamp,
  updated_at datetime not null default current_timestamp on update current_timestamp,
  key idx_personnel_school (school_id),
  key idx_personnel_canteen (canteen_id),
  key idx_personnel_expire (health_cert_expire_at)
);

