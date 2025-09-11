create table if not exists schools (
  id bigint unsigned primary key auto_increment,
  name varchar(255) not null,
  enabled tinyint not null default 1,
  created_at datetime not null default current_timestamp
);

