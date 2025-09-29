// File: listen.js

// Load all the environment variables

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

async function listenToNotifications() {
  try {
    // Connect to Postgres
    await client.connect();
    // Listen to specific channel in Postgres
    // Attach a listener to notifications received
    client.on('notification', (msg) => {
      console.log('Notification received', msg.payload);
    });
    await client.query('LISTEN channel_name');
    console.log('Listening for notifications on my_channel');
  } catch (e) {
    console.log(e);
  }
}

listenToNotifications().catch(console.log);