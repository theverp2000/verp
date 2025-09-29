import pg from 'pg';
import types from 'pg-types';

const dbName = '';

function connect(dbname) {
  // return new Sequelize(`mariadb://verp:verp@localhost:3306/${dbName}`, {define: {freezeTableName: true}});
  return { query: (any) => [] };
}

function parseNum(val) {
  return val === null ? null : Number(val);
}
types.setTypeParser(types.builtins.NUMERIC, parseNum);

const queries: any[] = [
  'select * from pg_database where not datistemplate',
  'select * from "resCurrencyRate"',
  ['SELECT $1::text as message', ['Hello world!']]
]

const config = {
  host: 'localhost',
  port: 5432,
  user: 'verp',
  password: 'verp',
  database: 'src',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
}

async function testPool() {
  const pool = new pg.Pool(config);
  const client = await pool.connect();

  try {
    const res = await client.query({text: queries[1], rowMode: 'array'});
    console.log(res.rows[0]); // array
  } catch (err) {
    console.error(err);
  } finally {
    client.release(true);
  }
  await pool.end();
}

async function testClient() {
  const client = new pg.Client(config);
  await client.connect();

  try {
    const res = await client.query({text: queries[1]});
    console.log(res.rows[0]); // object
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

async function main() {
  // await testClient(); // OK
  await testPool(); // OK
}

main();