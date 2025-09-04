-- Clear transactional inventory tables (use DELETE for broad MySQL compatibility)
delete from inv_inbound;
delete from inv_outbound;
delete from inv_tickets;
delete from inv_additives;

-- Update inv_inbound: id -> INT AUTO_INCREMENT NOT NULL, add school_id INT NOT NULL
alter table inv_inbound drop primary key;
alter table inv_inbound
  modify column id int not null auto_increment,
  add column school_id int not null after id,
  add primary key (id);
create index idx_inv_in_school_at on inv_inbound (school_id, at);

-- Update inv_outbound: id -> INT AUTO_INCREMENT NOT NULL, add school_id INT NOT NULL
alter table inv_outbound drop primary key;
alter table inv_outbound
  modify column id int not null auto_increment,
  add column school_id int not null after id,
  add primary key (id);
create index idx_inv_out_school_at on inv_outbound (school_id, at);

-- Update inv_tickets: id -> INT AUTO_INCREMENT NOT NULL, add school_id INT NOT NULL
alter table inv_tickets drop primary key;
alter table inv_tickets
  modify column id int not null auto_increment,
  add column school_id int not null after id,
  add primary key (id);
create index idx_inv_tickets_school_at on inv_tickets (school_id, at);

-- Update inv_additives: id -> INT AUTO_INCREMENT NOT NULL, add school_id INT NOT NULL
alter table inv_additives drop primary key;
alter table inv_additives
  modify column id int not null auto_increment,
  add column school_id int not null after id,
  add primary key (id);
create index idx_inv_additives_school_at on inv_additives (school_id, at);
