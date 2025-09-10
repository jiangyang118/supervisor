-- Adjust unique constraint to include deleted flag
alter table inv_products drop index uk_inv_products_uniq;
alter table inv_products add unique key uk_inv_products_uniq (school_id, name, spec, deleted);
