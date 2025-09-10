-- Add soft-delete flag for products
alter table inv_products add column deleted tinyint not null default 0;
create index idx_inv_products_deleted on inv_products(deleted);
