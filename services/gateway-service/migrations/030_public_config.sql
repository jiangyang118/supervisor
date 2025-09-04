-- Public config tables (per school), with audit

create table if not exists public_config (
  school_id int primary key,
  live tinyint not null default 1,
  rating tinyint not null default 1,
  org_cert tinyint not null default 1,
  staff_cert tinyint not null default 1,
  level tinyint not null default 1,
  `trace` tinyint not null default 1,
  menu tinyint not null default 1,
  updated_at datetime not null default current_timestamp,
  constraint fk_pc_school foreign key (school_id) references schools(id) on update cascade on delete restrict
);

create table if not exists public_config_audit (
  id int primary key auto_increment,
  school_id int not null,
  by_user varchar(128) null,
  at datetime not null default current_timestamp,
  changes_json json null,
  key idx_pca_school_at (school_id, at),
  constraint fk_pca_school foreign key (school_id) references schools(id) on update cascade on delete cascade
);

