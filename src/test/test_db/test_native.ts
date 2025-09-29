var Client = require('pg-native')

const config = {
  host: 'localhost',
  port: 5432,
  user: 'verp',
  password: 'verp',
  database: 'src',
  // max: 20,
  // idleTimeoutMillis: 30000,
  // connectionTimeoutMillis: 2000,
}

// function testPool() {
//   const pool = new pg.Pool(config);
//   const client = await pool.connect();

//   try {
//     const res = await client.query({text: queries[1], rowMode: 'array'});
//     console.log(res.rows[0]); // array
//   } catch (err) {
//     console.error(err);
//   } finally {
//     client.release(true);
//   }
//   await pool.end();
// }


function testClient() {
  var client = new Client();

  client.connectSync('postgresql://verp:verp@localhost:5432/src'); // OK

  //text queries
  var rows = client.querySync('SELECT NOW() AS the_date')
  console.log(rows[0].the_date) //Tue Sep 16 2014 23:42:39 GMT-0400 (EDT)

  // parameterized queries
  var rows = client.querySync('SELECT $1::text as twitter_handle', ['@briancarlson'])
  console.log(rows[0].twitter_handle) //@briancarlson

  //prepared statements
  client.prepareSync('get_twitter', 'SELECT $1::text as twitter_handle', 1)

  var rows = client.executeSync('get_twitter', ['@briancarlson'])
  console.log(rows[0].twitter_handle) //@briancarlson

  var rows = client.executeSync('get_twitter', ['@realcarrotfacts'])
  console.log(rows[0].twitter_handle) //@realcarrotfacts

  client.close();
}

testClient();