-- Attachments for inbound docs (tickets and images)
CREATE TABLE IF NOT EXISTS inbound_attachments (
  id int PRIMARY KEY AUTO_INCREMENT,
  doc_no varchar(64) NOT NULL,
  type varchar(32) NOT NULL, -- ticket_quarantine, ticket_invoice, ticket_receipt, image
  image_url varchar(255) NOT NULL,
  created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_inb_att_doc (doc_no),
  KEY idx_inb_att_type (type)
);

