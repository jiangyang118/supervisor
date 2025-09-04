delete from inv_inbound;
delete from inv_outbound;
delete from inv_tickets;
delete from inv_additives;

alter table inv_inbound add column school_id int not null after id;
create index idx_inv_in_school_at on inv_inbound (school_id, at);

alter table inv_outbound add column school_id int not null after id;
create index idx_inv_out_school_at on inv_outbound (school_id, at);

alter table inv_tickets add column school_id int not null after id;
create index idx_inv_tickets_school_at on inv_tickets (school_id, at);

alter table inv_additives add column school_id int not null after id;
create index idx_inv_additives_school_at on inv_additives (school_id, at);
