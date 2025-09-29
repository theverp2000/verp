import * as path from 'path';
import * as fs from 'fs';

const APPDATA = 'c:\\Users\\Admin\\AppData';
const h = '%HOMEPATH%';
const p = '%APPDATA%/..'

const conf = 'D:\\Programs\\NodeJs\\ts-verp\\src\\config.json';
const link = 'D:\\Programs\\NodeJs\\ts-verp\\src';
const dir = 'D:\\Programs\\NodeJs\\myapp2\\temp';

try {
  fs.mkdirSync(dir, {mode: 0o700, recursive: true});
} catch(e) {
  console.log(e.message);
}

console.log('end');