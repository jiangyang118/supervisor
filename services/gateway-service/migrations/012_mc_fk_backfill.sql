-- Backfill morning_checks.school_id from raw JSON, then add FK to schools(id)

-- 1) Backfill from raw.schoolId when available
update morning_checks
set school_id = JSON_UNQUOTE(JSON_EXTRACT(raw, '$.schoolId'))
where school_id is null
  and JSON_EXTRACT(raw, '$.schoolId') is not null
  and JSON_UNQUOTE(JSON_EXTRACT(raw, '$.schoolId')) <> '';

-- 2) Null-out any non-existent school ids to avoid FK violations
update morning_checks mc
left join schools s on s.id = mc.school_id
set mc.school_id = null
where mc.school_id is not null and s.id is null;

-- 3) Add FK (idempotent attempt):
alter table morning_checks
  add constraint fk_mc_school foreign key (school_id) references schools(id)
  on update cascade on delete set null;

