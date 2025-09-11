-- Supplier certificates table and supplier audit fields

create table if not exists supplier_certificates (
  id int primary key auto_increment,
  supplier_id int not null,
  type varchar(64) not null,
  number varchar(128) null,
  authority varchar(255) null,
  expire_at datetime null,
  image_url varchar(255) null,
  created_at datetime not null default current_timestamp,
  key idx_sup_cert_supplier (supplier_id),
  key idx_sup_cert_type (type),
  key idx_sup_cert_expire (expire_at)
);

-- Add created_by and created_at to inv_suppliers if missing (MySQL 8+)
-- Add created_by if missing (compatible with MySQL 5.7/8.0)
SET @has_cb := (
  SELECT COUNT(1) FROM information_schema.columns
   WHERE table_schema = DATABASE() AND table_name = 'inv_suppliers' AND column_name = 'created_by'
);
SET @stmt := (SELECT IF(@has_cb = 0, 'ALTER TABLE inv_suppliers ADD COLUMN created_by varchar(255) null AFTER email', 'SELECT 1'));
PREPARE s_cb FROM @stmt; EXECUTE s_cb; DEALLOCATE PREPARE s_cb;

-- Add created_at if missing
SET @has_ca := (
  SELECT COUNT(1) FROM information_schema.columns
   WHERE table_schema = DATABASE() AND table_name = 'inv_suppliers' AND column_name = 'created_at'
);
SET @stmt := (SELECT IF(@has_ca = 0, 'ALTER TABLE inv_suppliers ADD COLUMN created_at datetime not null default current_timestamp AFTER created_by', 'SELECT 1'));
PREPARE s_ca FROM @stmt; EXECUTE s_ca; DEALLOCATE PREPARE s_ca;
