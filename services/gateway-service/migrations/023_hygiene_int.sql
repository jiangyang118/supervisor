-- Align hygiene tables to INT auto-increment ids to avoid BIGINT string issues

ALTER TABLE hygiene_inspections
  MODIFY COLUMN id INT NOT NULL AUTO_INCREMENT,
  MODIFY COLUMN school_id INT NOT NULL,
  MODIFY COLUMN date DATETIME NOT NULL;

ALTER TABLE asset_maintenance
  MODIFY COLUMN id INT NOT NULL AUTO_INCREMENT,
  MODIFY COLUMN school_id INT NOT NULL,
  MODIFY COLUMN date DATETIME NOT NULL;

