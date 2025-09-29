import assert from 'assert';
import { parse } from 'csv-parse/sync';

import * as fs from 'fs';
import * as xml2js from 'xml2js';

(async function main() {
  const data = fs.readFileSync(__dirname + '/res.lang.csv');
  const records: {}[] = parse(data, {
    // columns: true,
    skip_empty_lines: true
  });
  console.log('len:', records.length);
  console.log('line 0:', records[0]);

  // const builder = new xml2js.Builder();
  // const xml = builder.buildObject(records[0]);
  // console.log(xml);
})();

// const input = `
// "key_1","key_2"
// "value 1","value 2"
// `;
// const records = parse(input, {
//   columns: true,
//   skip_empty_lines: true
// });
// assert.deepStrictEqual(
//   records,
//   [{ key_1: 'value 1', key_2: 'value 2' }]
// );
// console.log(records);

export {}