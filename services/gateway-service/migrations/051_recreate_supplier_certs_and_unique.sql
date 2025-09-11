-- Recreate supplier_certificates (if missing) and ensure unique index on inv_suppliers(school_id,name)

-- 1) Create supplier_certificates if not exists
CREATE TABLE IF NOT EXISTS supplier_certificates (
  id int PRIMARY KEY AUTO_INCREMENT,
  supplier_id int NOT NULL,
  type varchar(64) NOT NULL,
  number varchar(128) NULL,
  authority varchar(255) NULL,
  expire_at datetime NULL,
  image_url varchar(255) NULL,
  created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_sup_cert_supplier (supplier_id),
  KEY idx_sup_cert_type (type),
  KEY idx_sup_cert_expire (expire_at)
);

-- 2) Ensure unique index on (school_id, name)
SET @has_idx := (
  SELECT COUNT(1) FROM information_schema.statistics
   WHERE table_schema = DATABASE() AND table_name = 'inv_suppliers' AND index_name = 'uk_inv_suppliers_school_name'
);
SET @stmt := (
  SELECT IF(@has_idx = 0,
    'ALTER TABLE inv_suppliers ADD UNIQUE KEY uk_inv_suppliers_school_name (school_id, name)',
    'SELECT 1')
);
PREPARE s1 FROM @stmt; EXECUTE s1; DEALLOCATE PREPARE s1;

