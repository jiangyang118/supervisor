-- Canteens (school-side canteen master table)
create table if not exists canteens (
  id int primary key auto_increment,
  school_id int not null,
  name varchar(255) not null,
  address varchar(255) null,
  manager varchar(128) null,
  phone varchar(32) null,
  license_no varchar(128) null,
  license_expire_at datetime null,
  license_image_url varchar(1024) null,
  created_at datetime not null default current_timestamp,
  key idx_canteens_school (school_id),
  key idx_canteens_name (name)
);

-- FK to schools
alter table canteens
  add constraint fk_canteens_school foreign key (school_id) references schools(id)
  on update cascade on delete restrict;

-- Canteen qualifications (business license, food operation permit)
create table if not exists canteen_qualifications (
  id int primary key auto_increment,
  canteen_id int not null,
  qtype varchar(64) not null,
  number varchar(128) null,
  authority varchar(255) null,
  permit_items varchar(255) null,
  expire_at datetime null,
  image_url varchar(1024) null,
  created_at datetime not null default current_timestamp,
  key idx_cq_canteen (canteen_id),
  key idx_cq_expire (expire_at)
);

-- FK to canteens
alter table canteen_qualifications
  add constraint fk_cq_canteen foreign key (canteen_id) references canteens(id)
  on update cascade on delete cascade;

