-- Re-create inv_products with extended columns
create table if not exists inv_products (
  id bigint unsigned primary key auto_increment,
  school_id bigint unsigned not null,
  name varchar(255) not null,
  unit varchar(64) not null,
  category varchar(64) null,
  spec varchar(128) not null default '',
  last_price decimal(18,2) null,
  created_at datetime not null default current_timestamp,
  key idx_inv_products_school (school_id),
  key idx_inv_products_category (category),
  unique key uk_inv_products_uniq (school_id, name, spec)
);
