-- Add school_id to morning_checks and index for querying by school
alter table morning_checks
  add column school_id bigint null after id;

create index idx_mc_school_time on morning_checks(school_id, check_time);
