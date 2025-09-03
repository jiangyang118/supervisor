-- Add foreign key for disinfection records

alter table disinfection_records
  add index idx_df_school (school_id);

alter table disinfection_records
  add constraint fk_df_school foreign key (school_id) references schools(id)
  on update cascade on delete restrict;

