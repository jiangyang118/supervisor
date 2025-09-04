-- Canteens and qualifications tables

create table if not exists canteens (
  id int primary key auto_increment,
  school_id int not null,
  name varchar(255) not null,
  address varchar(255) null,
  license_no varchar(128) null,
  license_expire_at datetime null,
  license_image_url varchar(255) null,
  created_at datetime not null default current_timestamp,
  updated_at datetime not null default current_timestamp on update current_timestamp,
  key idx_canteen_school (school_id),
  key idx_canteen_name (name)
);

create table if not exists canteen_qualifications (
  id int primary key auto_increment,
  canteen_id int not null,
  qtype varchar(64) not null, -- e.g., PERMIT, HYGIENE, OTHER
  number varchar(128) null,
  expire_at datetime null,
  image_url varchar(255) null,
  created_at datetime not null default current_timestamp,
  updated_at datetime not null default current_timestamp on update current_timestamp,
  key idx_cq_canteen (canteen_id),
  key idx_cq_expire (expire_at)
);

