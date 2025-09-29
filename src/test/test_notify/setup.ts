// File: setup.js

const { Client } = require('pg');
const config = {
  host: 'localhost',
  port: 5432,
  user: 'verp',
  password: 'verp',
  database: 'postgres',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
}
const client = new Client(config);

async function setupTrigger() {
  try {
    // Connect to Postgres
    await client.connect();
    // Create a my_table if it does not already exist
    await client.query(`CREATE TABLE IF NOT EXISTS
    my_table (id SERIAL PRIMARY KEY, message TEXT)`);
    // Define the my_trigger_function function to send notifications
    
    await client.query(`
    CREATE OR REPLACE FUNCTION my_trigger_function() RETURNS trigger AS $$
    DECLARE
      rec RECORD;
      payload TEXT;
    BEGIN
      rec := NEW;
      payload := json_build_object('record', row_to_json(NEW));
      PERFORM pg_notify('channel_name', payload);
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;`);

    // Create the my_trigger to call the my_trigger_function after each insert
    await client.query(`
    CREATE TRIGGER my_trigger
    AFTER INSERT ON my_table
    FOR EACH ROW
    EXECUTE FUNCTION my_trigger_function();`);

    /*
    await client.query(`
    CREATE OR REPLACE FUNCTION my_trigger_function() RETURNS trigger AS $trigger$
    DECLARE
      rec RECORD;
      dat RECORD;
      payload TEXT;
    BEGIN

      -- Set record row depending on operation
      CASE TG_OP
      WHEN 'UPDATE' THEN
        rec := NEW;
        dat := OLD;
      WHEN 'INSERT' THEN
        rec := NEW;
      WHEN 'DELETE' THEN
        rec := OLD;
      ELSE
        RAISE EXCEPTION 'Unknown TG_OP: "%". Should not occur!', TG_OP;
      END CASE;
      
      -- Build the payload
      payload := json_build_object('timestamp',CURRENT_TIMESTAMP,'action',LOWER(TG_OP),'schema',TG_TABLE_SCHEMA,'identity',TG_TABLE_NAME,'record',row_to_json(rec), 'old',row_to_json(dat));

      -- Notify the channel
      PERFORM pg_notify('channel_name', payload);
      
      RETURN rec;
    END;
    $trigger$ LANGUAGE plpgsql;
    `);

    // Create the my_trigger to call the my_trigger_function after each insert, update, delete
    await client.query(`
    CREATE TRIGGER my_trigger
    AFTER INSERT OR UPDATE OR DELETE ON my_table
    FOR EACH ROW
    EXECUTE FUNCTION my_trigger_function();`);
    */
          
    console.log('Event triggers setup complete.');
    await client.end();
  } catch (e) {
    console.log(e);
  }
}

setupTrigger().catch(console.log);