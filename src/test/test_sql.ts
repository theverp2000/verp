import { Sequelize, DataTypes } from '../core/service/sequelize';
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite'
});
// let userDB = new sqlite3.Database("./user1.db", 
//   sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, 
//   (err) => { 
//       // do your thing 
//   });
// const sequelize = new Sequelize('postgres://verp:verp@localhost:5432/test_tsc') // Example for postgres

sequelize.authenticate({}).catch((err) => {
  throw new Error(`Unable to connect to the database: ${err}`)
});

// sequelize.sync()
// .then(() => {
//   console.log("Synced db.");
// })
// .catch((err) => {
//   console.log("Failed to sync db: " + err.message);
// });

async function example() {
  // let jane, users;

  const User = sequelize.define('User', {
    username: DataTypes.STRING,
    birthday: DataTypes.DATE,
  });

  const jane = await User.create({
      username: 'janedoe',
      birthday: new Date(1980, 6, 20),
    });

  const users = await User.findAll();

  console.log(jane);
  console.log(users);

}

const sql_create = 
  `CREATE TABLE contacts (
    contact_id INTEGER PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL UNIQUE
  )`;

const sql_select = `SELECT * FROM contacts`;

const sql_insert =
  `INSERT INTO contacts (first_name,last_name,email, phone)
  VALUES('Tommy','Leong','tommy@gmail.com','0918411488')`

async function creat_table(sql: string) {
  let res;
  try {
    res = await sequelize.query(
      sql
    );
  } catch(e) {
    console.log('eeeeee');
  }
  console.log(res);
}

async function check_table_sqlite(table: string) {
  const sql = `SELECT name FROM sqlite_master WHERE type='table' AND name='${table}'`;
  const [res, meta] = await sequelize.query(
    sql
  );
  console.log(res, meta);
}

async function run_sql(sql: string) {
  const [res, meta] = await sequelize.query(
    sql
  );
  console.log(res);
}

async function creatDatabase(dbName: string) {
  let res;
  try {
    const sequelize = new Sequelize('postgres://verp:verp@localhost:5432/test_tsc_dummy')
    res = await sequelize.getQueryInterface().createDatabase(dbName);
  } catch(e) {
    console.log(e.message);
  }
  console.log(res);
}

// creatDatabase('secondDB');

// creat_database('test_tsc');
// check_table('contacts');
// creat_table(sql_create);
// check_table('users');
// run_sql(sql_insert);
// run_sql(sql_select);
