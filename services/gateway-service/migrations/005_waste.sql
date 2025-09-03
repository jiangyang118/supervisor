-- Waste domain tables

create table if not exists waste_categories (
  id varchar(64) not null primary key,
  name varchar(255) not null,
  enabled tinyint(1) not null default 1,
  created_at datetime not null default current_timestamp,
  unique key uk_waste_categories_name(name)
);

create table if not exists waste_records (
  id int not null primary key auto_increment,
  school_id int not null,
  date date not null,
  category varchar(255) not null,
  amount decimal(18,3) not null default 0,
  buyer varchar(255) not null,
  person varchar(255) not null,
  created_at datetime not null default current_timestamp
);

-- seed default categories (idempotent)
insert ignore into waste_categories (id, name, enabled) values
  ('wc-001', '餐厨垃圾', 1),
  ('wc-002', '过期食材', 1);
