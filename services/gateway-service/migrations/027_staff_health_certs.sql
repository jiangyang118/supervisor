-- Table: school_staff_certs (personnel health certificates)
-- Links each certificate to a school (school_id) and a staff member (staff_id)

create table if not exists school_staff_certs (
  id int primary key auto_increment,
  school_id int not null,
  staff_id int not null,
  cert_no varchar(64) null,
  start_at datetime null,
  end_at datetime null,
  image_url varchar(1024) null,
  created_at datetime not null default current_timestamp,
  key idx_shc_school (school_id),
  key idx_shc_staff (staff_id),
  key idx_shc_end (end_at)
);

-- Foreign keys
alter table school_staff_certs
  add constraint fk_shc_school foreign key (school_id) references schools(id) on update cascade on delete restrict,
  add constraint fk_shc_staff foreign key (staff_id) references school_staff(id) on update cascade on delete cascade;

