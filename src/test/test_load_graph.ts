import * as core from '../core'
import { initializeSysPath, loadInformationFromDescriptionFile } from "../core/modules";
import { dbConnect } from '../core/sql_db';

async function doAll() {
  initializeSysPath();

  const database = core.tools.config.get('dbName');

  const cnx = dbConnect(database);
  const cr = cnx.cursor();

  const graph = new core.modules.graph.Graph();
  await graph.addModule(cr, 'base', []);
  await graph.addModule(cr, 'account', []);
  if (graph) {
    console.log(graph);
  }
}

doAll();