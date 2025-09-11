-- RBAC core tables: users, roles, permissions, user_roles, role_permissions

create table if not exists roles (
  id bigint unsigned primary key auto_increment,
  name varchar(64) not null unique
);

create table if not exists permissions (
  `key` varchar(128) primary key,
  label varchar(255) not null
);

create table if not exists role_permissions (
  role_id bigint unsigned not null,
  permission_key varchar(128) not null,
  primary key (role_id, permission_key),
  key idx_rp_role (role_id),
  key idx_rp_perm (permission_key),
  constraint fk_rp_role foreign key (role_id) references roles(id) on update cascade on delete cascade,
  constraint fk_rp_perm foreign key (permission_key) references permissions(`key`) on update cascade on delete cascade
);

create table if not exists users (
  id bigint unsigned primary key auto_increment,
  username varchar(128) not null unique,
  display_name varchar(128) not null,
  enabled tinyint not null default 1
);

create table if not exists user_roles (
  user_id bigint unsigned not null,
  role_id bigint unsigned not null,
  primary key (user_id, role_id),
  key idx_ur_user (user_id),
  key idx_ur_role (role_id),
  constraint fk_ur_user foreign key (user_id) references users(id) on update cascade on delete cascade,
  constraint fk_ur_role foreign key (role_id) references roles(id) on update cascade on delete cascade
);

-- Seed minimal data if empty
insert ignore into roles(name) values ('ADMIN'), ('SCHOOL');

insert ignore into permissions(`key`, label) values
('users.view','用户查看'),
('users.manage','用户管理'),
('roles.view','角色查看'),
('roles.manage','角色管理'),
('announcements.read','公告阅读'),
('announcements.publish','公告发布'),
('reports.view','报表查看'),
('settings.*','系统设置（全部）');

-- Map default permissions
insert ignore into role_permissions(role_id, permission_key)
select r.id, p.`key` from roles r join permissions p
  where r.name = 'ADMIN';

insert ignore into role_permissions(role_id, permission_key)
select r.id, p.`key` from roles r join permissions p
  where r.name = 'SCHOOL' and p.`key` in ('announcements.read','reports.view');

-- Seed two demo users if not exists
insert ignore into users(username, display_name, enabled)
values ('admin','管理员',1), ('user','普通用户',1);

-- Bind user roles
insert ignore into user_roles(user_id, role_id)
select u.id, r.id from users u join roles r on u.username='admin' and r.name='ADMIN';

insert ignore into user_roles(user_id, role_id)
select u.id, r.id from users u join roles r on u.username='user' and r.name='SCHOOL';
