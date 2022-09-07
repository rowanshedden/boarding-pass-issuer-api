/* Replace with your SQL commands */

ALTER TABLE contacts ALTER COLUMN contact_id TYPE int USING contact_id::integer ADD AUTO_INCREMENT;
ALTER TABLE travelers ALTER COLUMN contact_id TYPE int USING contact_id::integer;
ALTER TABLE passports ALTER COLUMN contact_id TYPE int USING contact_id::integer;
ALTER TABLE connections ALTER COLUMN contact_id TYPE int USING contact_id::integer;

CREATE TABLE connections_to_contacts(
    connection_id text,
    contact_id int
);

insert into connections_to_contacts select connection_id, contact_id from connections;

ALTER TABLE connections DROP contact_id ;
