-- Add canteen association to waste records
alter table waste_records add column canteen_id int null after school_id;
create index idx_waste_canteen on waste_records(canteen_id);
