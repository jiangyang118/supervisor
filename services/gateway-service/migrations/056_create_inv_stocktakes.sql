-- Create stocktake records table
CREATE TABLE IF NOT EXISTS inv_stocktakes (
  id bigint unsigned primary key auto_increment,
  school_id bigint unsigned not null,
  inbound_id bigint unsigned not null,
  product_id bigint unsigned not null,
  prev_qty decimal(18,3) not null,
  actual_qty decimal(18,3) not null,
  diff decimal(18,3) not null,
  operator varchar(128) null,
  at datetime not null default current_timestamp,
  key idx_stocktake_school_at (school_id, at),
  key idx_stocktake_inbound (inbound_id)
);
