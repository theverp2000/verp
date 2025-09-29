import { Sequelize } from '../core/service/sequelize';
// const verp = require('../core');
import * as core from '../core';
import { Cursor } from '../core/sql_db';

import {Registry} from './../core/modules/registry'; 
import { stringify } from '../core/tools/json';

const source = './datatest';
const dbName = core.tools.config.get('dbName');

const postgres = new Sequelize(`postgres://verp:verp@localhost:5432/${dbName}`);
// const mariadb = new Sequelize(`mariadb://verp:verp@localhost:3306/${dbName}`);

// const reg = core.registry(dbName);

// for (const model of Object.values(reg.models)) {
//   const s = Array.from(new Set());
  
//   const info = {
//     _name: model._name,
//     _table: model._table,
//     _register: model._register,
//     _originalModule: model._originalModule,
//     _parentsModule: model._parentsModule,
//     _parentsChildren: model._parentsChildren,
//     _inheritsChildren: model._inheritsChildren,
//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     __base_classes: Array.from(model.__base_classes).map((cls: any) => cls._name),
//     _sequence: model._sequence,
//     _fields: model._fields,
//   }
//   // console.log(info);
// }

async function selectAll(cr: Cursor) {
  const res = await cr.execute(`SELECT id, name, symbol FROM res_currency;`);
  console.log(stringify(res));
}

async function selectIrModel(seq: Sequelize) {
  const model = seq.define("ir_model_data", {});
  const res = await model.findAll({
    attributes: ['name', 'module', 'model', 'createdAt', 'updatedAt'],
    where: {
      name: 'EUR'
    }
  });
  console.log(stringify(res));
}

async function selectResCurrency(seq: Sequelize) {
  const model = seq.define("res_currency", {}, {
    freezeTableName: true, // QUAN TRONG DE TRANH TU DONG DAT TEN TABLE SO NHIEU
    // underscored: true
  });
  const res = await model.findAll({
    attributes: ['id', 'name', 'symbol'],
    where: {
      name: 'EUR'
    }
  });
  console.log(stringify(res));
}

async function insertAll(seq: Sequelize) {
  const {data}  = require(source)(seq.dialect);

  const list = Array.isArray(data) ? data : [data];
  const query = await seq.getQueryInterface();
  for (const rec of list) {
    if (typeof rec === 'string') {
      await seq.query(rec);
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
      await query.insert(null, String(rec[0]), value);
    } else if (typeof rec === 'object') {
      for (const entry of Object.entries(rec)) {
        const value = {};
        Object.assign(value, entry[1]);
        await query.insert(null, String(entry[0]), value);
      }
    } else {
      console.log('Data invalid. Must be an object or {} or [tableName, [fields], [values]]')
    }
  }
}

function resetModulesState() {
  core.modules.resetModulesState(dbName);  
}

async function doAll() {
  const reg = await core.registry(dbName);

  try {
    console.log('*** Postgres ***');
    const cr = reg.cursor();
    // const sequelize = cr._obj;
    // await insertAll(sequelize); //OK
    await selectAll(cr); //OK
    // await selectIrModel(sequelize); //OK
    // await selectResCurrency(sequelize); //OK
    resetModulesState(); // OK
  } catch(e) {
    console.log('ERROR: ', e.message);
  }
  // postgres.close();
}

doAll();