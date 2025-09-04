create table if not exists trustivs_cache (
  `key` varchar(255) not null primary key,
  `value` mediumtext not null,
  `stale_at` datetime not null,
  `expires_at` datetime not null,
  `type` varchar(64) null,
  key idx_expires_at(`expires_at`)
);

