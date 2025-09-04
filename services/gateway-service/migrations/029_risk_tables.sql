-- Risk management tables with INT school_id

-- Catalog of risk items
create table if not exists risk_catalog (
  id int primary key auto_increment,
  category varchar(128) null,
  title varchar(255) not null,
  level varchar(16) not null,
  `desc` text null,
  enabled tinyint not null default 1,
  key idx_rc_enabled (enabled)
);

-- Risk reports (hazard reports)
create table if not exists risk_reports (
  id int primary key auto_increment,
  school_id int not null,
  at datetime not null,
  location varchar(255) not null,
  object varchar(255) not null,
  `desc` text not null,
  images json null,
  risk_id int null,
  status varchar(16) not null,
  measures text null,
  rectified_by varchar(128) null,
  rectified_at datetime null,
  key idx_rr_school_at (school_id, at),
  key idx_rr_status_at (status, at)
);

-- Risk tasks (inspection tasks)
create table if not exists risk_tasks (
  id int primary key auto_increment,
  school_id int not null,
  created_at datetime not null,
  assignee varchar(128) not null,
  location varchar(255) not null,
  object varchar(255) not null,
  risk_id int null,
  due_at datetime null,
  note varchar(255) null,
  status varchar(16) not null,
  result text null,
  result_images json null,
  key idx_rt_school_created (school_id, created_at),
  key idx_rt_status_created (status, created_at)
);

-- Add foreign keys (guarded with information_schema checks)
SET @stmt := (
  SELECT IF(NOT EXISTS(
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = DATABASE() AND table_name = 'risk_reports'
      AND constraint_type = 'FOREIGN KEY' AND constraint_name = 'fk_rr_school'
  ),
  'ALTER TABLE risk_reports ADD CONSTRAINT fk_rr_school FOREIGN KEY (school_id) REFERENCES schools(id) ON UPDATE CASCADE ON DELETE RESTRICT',
  'SELECT 1')
);
PREPARE s1 FROM @stmt; EXECUTE s1; DEALLOCATE PREPARE s1;

SET @stmt := (
  SELECT IF(NOT EXISTS(
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = DATABASE() AND table_name = 'risk_tasks'
      AND constraint_type = 'FOREIGN KEY' AND constraint_name = 'fk_rt_school'
  ),
  'ALTER TABLE risk_tasks ADD CONSTRAINT fk_rt_school FOREIGN KEY (school_id) REFERENCES schools(id) ON UPDATE CASCADE ON DELETE RESTRICT',
  'SELECT 1')
);
PREPARE s2 FROM @stmt; EXECUTE s2; DEALLOCATE PREPARE s2;

SET @stmt := (
  SELECT IF(NOT EXISTS(
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = DATABASE() AND table_name = 'risk_reports'
      AND constraint_type = 'FOREIGN KEY' AND constraint_name = 'fk_rr_risk'
  ),
  'ALTER TABLE risk_reports ADD CONSTRAINT fk_rr_risk FOREIGN KEY (risk_id) REFERENCES risk_catalog(id) ON UPDATE CASCADE ON DELETE SET NULL',
  'SELECT 1')
);
PREPARE s3 FROM @stmt; EXECUTE s3; DEALLOCATE PREPARE s3;

SET @stmt := (
  SELECT IF(NOT EXISTS(
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = DATABASE() AND table_name = 'risk_tasks'
      AND constraint_type = 'FOREIGN KEY' AND constraint_name = 'fk_rt_risk'
  ),
  'ALTER TABLE risk_tasks ADD CONSTRAINT fk_rt_risk FOREIGN KEY (risk_id) REFERENCES risk_catalog(id) ON UPDATE CASCADE ON DELETE SET NULL',
  'SELECT 1')
);
PREPARE s4 FROM @stmt; EXECUTE s4; DEALLOCATE PREPARE s4;

