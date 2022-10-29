/* Replace with your SQL commands */

ALTER TABLE contacts ALTER COLUMN contact_id TYPE text;
ALTER TABLE contacts ADD CONSTRAINT unique_contact_id UNIQUE (contact_id);
ALTER TABLE travelers ALTER COLUMN contact_id TYPE text;
ALTER TABLE passports ALTER COLUMN contact_id TYPE text;
ALTER TABLE connections ADD COLUMN contact_id text;

UPDATE connections 
    SET contact_id = connections_to_contacts.contact_id 
FROM connections c 
LEFT JOIN connections_to_contacts 
    on c.connection_id = connections_to_contacts.connection_id 
WHERE connections.connection_id = c.connection_id;

DROP TABLE connections_to_contacts;
