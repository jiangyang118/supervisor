-- Inventory tables
create table if not exists inv_categories (
  id varchar(64) primary key,
  name varchar(255) not null
);

create table if not exists inv_products (
  id varchar(64) primary key,
  name varchar(255) not null,
  unit varchar(64) not null,
  category_id varchar(64) null,
  key idx_inv_products_category (category_id)
);

create table if not exists inv_suppliers (
  id varchar(64) primary key,
  name varchar(255) not null,
  phone varchar(64) null,
  license varchar(128) null,
  address varchar(255) null,
  contact varchar(128) null,
  email varchar(128) null,
  enabled tinyint not null default 1,
  rating int null,
  categories json null,
  license_expire_at datetime null,
  license_image_url varchar(255) null,
  deleted tinyint not null default 0,
  unique key uk_inv_suppliers_phone (phone),
  unique key uk_inv_suppliers_license (license)
);

create table if not exists inv_warehouses (
  id varchar(64) primary key,
  name varchar(255) not null,
  location varchar(255) null,
  capacity int null,
  deleted tinyint not null default 0
);

create table if not exists inv_inbound (
  id int primary key auto_increment,
  school_id int not null,
  product_id varchar(64) not null,
  qty decimal(18,3) not null,
  supplier_id varchar(64) null,
  warehouse_id varchar(64) null,
  image_url varchar(255) null,
  at datetime not null,
  source varchar(32) not null,
  key idx_inv_in_school_at (school_id, at),
  key idx_inv_in_product (product_id)
);

create table if not exists inv_outbound (
  id int primary key auto_increment,
  school_id int not null,
  product_id varchar(64) not null,
  qty decimal(18,3) not null,
  purpose varchar(255) null,
  by_who varchar(128) null,
  warehouse_id varchar(64) null,
  at datetime not null,
  source varchar(32) not null,
  key idx_inv_out_school_at (school_id, at),
  key idx_inv_out_product (product_id)
);

create table if not exists inv_tickets (
  id int primary key auto_increment,
  school_id int not null,
  product_id varchar(64) not null,
  type varchar(128) not null,
  image_url varchar(255) null,
  at datetime not null,
  key idx_inv_tickets_school_at (school_id, at)
);

create table if not exists inv_additives (
  id int primary key auto_increment,
  school_id int not null,
  name varchar(128) not null,
  amount decimal(18,3) not null,
  dish varchar(128) null,
  by_who varchar(128) null,
  at datetime not null,
  key idx_inv_additives_school_at (school_id, at desc)
);

-- Public feedback
create table if not exists public_feedback (
  id varchar(64) primary key,
  school_id varchar(64) not null,
  type varchar(32) not null,
  content text not null,
  user varchar(128) null,
  contact varchar(128) null,
  status varchar(32) not null,
  at datetime not null,
  reply_by varchar(128) null,
  reply_at datetime null,
  reply_content text null,
  is_read tinyint not null default 0,
  processing_ms int null,
  key idx_pf_at (at)
);

-- Certificates
create table if not exists certificates (
  id varchar(64) primary key,
  owner varchar(255) not null,
  type varchar(128) not null,
  number varchar(128) not null,
  expire_at datetime not null,
  deleted tinyint not null default 0,
  key idx_cert_owner (owner)
);

-- Food waste
create table if not exists food_waste_records (
  id varchar(64) primary key,
  school_id varchar(64) not null,
  date datetime not null,
  source varchar(32) not null,
  item_type varchar(32) not null,
  item_name varchar(255) not null,
  weight_kg decimal(18,3) not null,
  amount_yuan decimal(18,2) not null,
  reason varchar(255) null,
  meal varchar(32) null,
  key idx_fw_date (date)
);

create table if not exists food_waste_reasons (
  id varchar(64) primary key,
  name varchar(255) not null,
  enabled tinyint not null default 1
);
