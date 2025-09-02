-- Add foreign keys for sampling tables

-- Ensure supporting indexes exist (MySQL may require indexed FK columns)
alter table sampling_records
  add index idx_sr_school (school_id);

alter table sampling_cleanups
  add index idx_sc_school (school_id);

-- Add FK: sampling_records.school_id -> schools.id
alter table sampling_records
  add constraint fk_sr_school foreign key (school_id) references schools(id)
  on update cascade on delete restrict;

-- Add FK: sampling_cleanups.school_id -> schools.id
alter table sampling_cleanups
  add constraint fk_sc_school foreign key (school_id) references schools(id)
  on update cascade on delete restrict;

-- Add FK: sampling_cleanups.sample_id -> sampling_records.id
alter table sampling_cleanups
  add constraint fk_sc_sample foreign key (sample_id) references sampling_records(id)
  on update cascade on delete set null;

