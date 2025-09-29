import * as db from '../../core/service/db';

function test1() {
  createDB('tsverp');
  createDB('tsverp2');
  createDB('tsverp3');
}

function createEmptyDatabase(name: string) {
  const db = sql_db.dbConnect(dbFactory.getSystemDbName());
  const cr = db.cursor();
  await cr.execute(dbFactory.sqlCreateDatabase(name));
  await cr.close();
}

function createDB(name: string) {
  db.MetaDatebase.createEmptyDatabase(name).catch((e) => {
    console.log("createDB:", e.message);
  });
}

