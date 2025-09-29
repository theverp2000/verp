// File: send.js

// Load all the environment variables
// require('dotenv').config();

import { Client } from 'pg';
const config = {
  host: 'localhost',
  port: 5432,
  user: 'verp',
  password: 'verp',
  database: 'test',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
}
const client = new Client(config);

async function insertRow(message) {
  try {
    // Connect to Postgres
    await client.connect();
    // Insert a row into Postgres table
    await client.query('INSERT INTO my_table (message) VALUES ($1)', [message]);
    console.log("Inserted a row in the 'my_table' table.");
    await client.query(`NOTIFY channel_name, '${message + " Me too"}'`);
    console.log("Notify a message.");
    await client.end();
  } catch (e) {
    console.log(e);
  }
}

insertRow('Hello, world!').catch(console.log);