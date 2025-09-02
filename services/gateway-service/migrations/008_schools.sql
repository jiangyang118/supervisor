create table if not exists schools (
  id varchar(64) primary key,
  name varchar(255) not null,
  enabled tinyint not null default 1,
  created_at datetime not null default current_timestamp
);

insert ignore into schools(id, name, enabled) values
  ('sch-001', '示例一中', 1),
  ('sch-002', '示例二小', 1),
  ('sch-003', '示例三幼', 1),
  ('sch-004', '示例四小', 1),
  ('sch-005', '示例五中', 1);

