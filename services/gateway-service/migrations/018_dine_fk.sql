-- Add FK for dine records

alter table dine_records
  add index idx_dr_school (school_id);

alter table dine_records
  add constraint fk_dr_school foreign key (school_id) references schools(id)
  on update cascade on delete restrict;

