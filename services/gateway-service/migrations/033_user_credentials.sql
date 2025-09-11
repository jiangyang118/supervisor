-- User credentials (salt + sha256 hash)

create table if not exists user_credentials (
  user_id bigint unsigned primary key,
  salt varchar(64) not null,
  password_hash varchar(128) not null,
  updated_at datetime not null default current_timestamp on update current_timestamp,
  key idx_uc_user (user_id)
);

-- Seed demo credentials for admin/admin and user/user if not exists
-- Use static salt for demo; production should rotate salts and use stronger hashing
set @salt_admin := 's@1t-admin';
set @salt_user := 's@1t-user';

insert ignore into user_credentials(user_id, salt, password_hash)
select u.id, @salt_admin, upper(sha2(concat(@salt_admin, 'admin'), 256))
  from users u where u.username = 'admin' limit 1;

insert ignore into user_credentials(user_id, salt, password_hash)
select u.id, @salt_user, upper(sha2(concat(@salt_user, 'user'), 256))
  from users u where u.username = 'user' limit 1;
