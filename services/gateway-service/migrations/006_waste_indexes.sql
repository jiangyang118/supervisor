-- Add indexes to improve waste_records queries
alter table waste_records
  add index idx_waste_records_school_date (school_id, date),
  add index idx_waste_records_category (category),
  add index idx_waste_records_created_at (created_at);

