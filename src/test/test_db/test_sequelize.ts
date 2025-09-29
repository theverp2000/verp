import { DataTypes, Sequelize } from '../../core/service/sequelize';

const source = './data';
const dbName = 'src_test';

const sysPostgres = new Sequelize('postgres://verp:verp@localhost:5432/postgres', {define: {freezeTableName: true}});
const postgres = new Sequelize(`postgres://verp:verp@localhost:5432/${dbName}`, {define: {freezeTableName: true}});
const sysMariadb = new Sequelize('mariadb://verp:verp@localhost:3306/sys', {define: {freezeTableName: true}});
const mariadb = new Sequelize(`mariadb://verp:verp@localhost:3306/${dbName}`, {define: {freezeTableName: true}});

async function createAll(seq: Sequelize): Promise<boolean> {
  const {models}  = require(source)(seq.dialect);

  const list = Array.isArray(models) ? models : [models];
  const query = await seq.getQueryInterface();
  // const t = await seq.transaction();
  let currentModel;
  try {
    // await seq.transaction(async (tr) => {
      for (const element of list) {
        if (typeof element !== 'object') {
          throw new Error('Data invalid. Must be an object or {}')
        }
        const command = `${element['#command']}`; 
        delete element['#command'];
        if (command === 'addConstraint') {
          for (const entry of Object.entries(element)) {
            const value: any = {};
            Object.assign(value, entry[1]);
            await query.addConstraint(entry[0], value);
          }
        } else {
          for (const entry of Object.entries(element)) {
            const value = Object.assign({}, entry[1]);
            currentModel = entry;
            const model = seq.define(String(entry[0]), value, {
              freezeTableName: true,
              createdAt: value['createdAt'] ? 'createdAt' : false,
              updatedAt: value['updatedAt'] ? 'updatedAt' : false
            });
            await model.sync({ force: true });
            // console.log(model.getAttributes());
            // await query.createTable(entry[0], value, { transaction: t });
          }
        }
      }
    // });
    // await t.commit();
    return true;
  } catch(e) {
    // await t.rollback();
    console.log(e.message, currentModel);
    return false;
  }
}

async function insertAll(seq: Sequelize): Promise<any[]> {
  const {data}  = require(source)(seq.dialect);

  const list = Array.isArray(data) ? data : [data];
  // const query = seq.getQueryInterface();
  // const t = await seq.transaction();
  const result: any[] = [];
  let current;
  try {
    // await seq.transaction(async (t) => {
      for (const rec of list) {
        if (typeof rec === 'string') {
          current = rec;
          const [res, meta] = await seq.query(rec);
          result.push(...res);
        } else if (Array.isArray(rec) && rec.length == 3) {
          const lenFields = Object.entries(rec[1]).length;
          const lenValues = Object.entries(rec[2]).length;
          if (lenValues !== lenFields) {
            throw new Error(`number of values (${lenValues}) not equals to number of fields (${lenFields}) for ${rec}`);
          }
          const value = {};
          for (let i=0; i < lenFields; i++) {
            value[String(rec[1][i])] = rec[2][i];
          }
          current = rec;
          const name = String(rec[0]);
          const res = await seq.model(name).create(value);
          // const res = await query.insert(null, String(rec[0]), value, { transaction: t, raw: raw });
          const val = {};
          val[name] = res.toJSON();
          result.push(val);
        } else if (typeof rec === 'object') {
          for (const entry of Object.entries(rec)) {
            const value = {};
            Object.assign(value, entry[1]);
            current = entry;
            const name = String(entry[0]);
            const res = await seq.model(name).create(value);
            // const res = await query.insert(null, String(entry[0]), value, { transaction: t, raw: raw });
            const val = {};
            val[name] = res.toJSON();
            result.push(val);
          }
        } else {
          throw new Error('Data invalid. Must be an object or {} or [tableName, [fields], [values]]')
        }
      }
    // });
    // await t.commit();
    return result;
  } catch(e) {
    // await t.rollback();
    console.log(e.message, current);
    return result;
  }
}

async function selectIrModel(seq: Sequelize) {
  const model = seq.define("ir_model_data", {
    createdAt: {
      field: 'createdAt',
      type: DataTypes.DATE,
    },
    updatedAt: {
      field: 'updatedAt',
      type: DataTypes.DATE,
    },
  });
  const res = await model.findAll({
    attributes: ['name', 'module', 'model', 'createdAt', 'updatedAt'],
    where: {
      name: 'EUR'
    }
  });
  console.log(JSON.stringify(res));
}

async function selectResCurrency(seq: Sequelize) {
  const res = await seq.model("resCurrency").findAll({
    attributes: ['id', 'name', 'symbol'],
    where: {
      name: 'EUR'
    }
  });
  console.log(JSON.stringify(res));
}

async function describeTable(seq: Sequelize, tableName: string) {
  // Cach 1: OK
  // const gen: any = seq.getQueryInterface().queryGenerator;
  // const sql = gen.describeTableQuery('irModelDataa'); 
  // const res: any = await seq.query(sql, {type: QueryTypes.DESCRIBE});
  
  // Cach 2: OK
  const res = await seq.getQueryInterface().describeTable(tableName);

  return res;
}

async function extractTableDetails(seq: Sequelize, tableName: string) {
  const genQuery: any = seq.getQueryInterface(); 
  return genQuery.extractTableDetails(tableName);
}

async function _tableHasRows(seq: Sequelize, _table: string): Promise<number> {
  // const self = this as any;
  // const cls = this.constructor as any;
  const res = await seq.query(
    `SELECT 1 FROM "${_table}" LIMIT 1`
  )
  // model(cls._table).findAll({
  //   attributes: ['id'],
  //   limit: 1,
  //   where: {
  //     id: {[Op.gte]: 0}
  //   }
  // })
  return res.length;
}

async function doAll() {
  let transaction;
  try {
    console.log('*** Postgres ***');
    await sysPostgres.getQueryInterface().dropDatabase(dbName);
    await sysPostgres.getQueryInterface().createDatabase(dbName);

    transaction = await postgres.startUnmanagedTransaction();
    await createAll(postgres);
    await transaction.commit();
    
    await postgres.transaction((t2) => {
      console.log('Before call Promise');
      return Promise.all([
        console.log('Inside Promise'),
        insertAll(postgres)
      ]);
      // console.log('After call Promise');
    });
    console.log('After Promise')
 
    // const res = await tableExists(postgres, 'irModelData');
    // console.log(res);
    
    // const res = await describeTable(postgres, 'irModelData');
    // console.dir(res);

    // const res = await _tableHasRows(postgres, 'irModel');
    // console.log(res);

    // console.log(await insertAll(postgres));
    // await selectResCurrency(postgres);
    // if (res) {
    //   await selectModules(postgres, ['base']);
    // } else {
    //   console.log('Khong tim thay table irModuleModule');
    // }

    console.log('*** Mariadb ***');
    await sysMariadb.getQueryInterface().dropDatabase(dbName);
    await sysMariadb.getQueryInterface().createDatabase(dbName);

    await createAll(mariadb);
    console.log(await insertAll(mariadb));

    // const res = await mariadb.describeTable();
    // console.log(res);

  } catch(e) {
    console.log(e.message);
    if (transaction) {
      await transaction.rollback();
    }
  } finally {
    sysPostgres.close();
    postgres.close();

    sysMariadb.close();
    mariadb.close()
  }
  console.log('EXIT');
  process.exit();
}

const d = DataTypes.BLOB;
console.log(`d: ${d}`);
  // doAll()
// console.log('STOP');