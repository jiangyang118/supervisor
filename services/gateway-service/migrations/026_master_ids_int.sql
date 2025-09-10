-- NOTE: This migration converts master tables to INT auto-increment IDs
-- and associates them with school_id (INT NOT NULL). It also aligns
-- referencing columns to INT where applicable. Existing rows get
-- school_id = 1 by default. Adjust as needed per deployment.

-- Inventory master tables
alter table inv_categories
  modify column id int not null auto_increment,
  modify column school_id int not null,
  add index idx_inv_cat_school (school_id);

alter table inv_products
  modify column id int not null auto_increment,
  modify column school_id int not null,
  modify column category_id int null,
  add index idx_inv_prod_school (school_id);

alter table inv_suppliers
  modify column id int not null auto_increment,
  modify column school_id int not null,
  add index idx_inv_sup_school (school_id);

alter table inv_warehouses
  modify column id int not null auto_increment,
  modify column school_id int not null,
  add index idx_inv_wh_school (school_id);

-- Align referencing columns in transactional tables (already truncated in 025)
alter table inv_inbound
  modify column product_id int not null,
  modify column supplier_id int null,
  modify column warehouse_id int null;

alter table inv_outbound
  modify column product_id int not null,
  modify column warehouse_id int null;

alter table inv_tickets
  modify column product_id int not null;

-- Food waste tables
alter table food_waste_records
  modify column id int not null auto_increment,
  modify column school_id int not null,
  add index idx_fw_school_date (school_id, date);

alter table food_waste_reasons
  modify column id int not null auto_increment,
  add column school_id int not null default 1 after id,
  add index idx_fw_reason_school (school_id);

-- Certificates table
alter table certificates
  modify column id int not null auto_increment,
  add column school_id int not null default 1 after id,
  add index idx_cert_school (school_id);
