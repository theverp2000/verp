import fs from 'fs';
import path from 'path';

let argv = process.argv.slice(2);
let cmd;
if (argv.length) {
  cmd = argv[0];
  argv = argv.slice(1);  
}
process.argv = process.argv.filter((_, index) => index != 2);
console.log(`Test command "${cmd}" args: [${argv}]`);
console.log('Dir: '+ __dirname);
console.log('====='+'='.repeat(__dirname.length));

const name = __dirname + path.sep + 'test_' + cmd;
if (fs.existsSync(name + '.ts')) {
  require(name + '.ts'); // file
} else {
  require(name + path.sep + 'index.ts'); // folder
}