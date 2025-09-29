// import * as path from 'path';
import * as path from 'path';
import pro from './import/es2017'; // => import default to get object: pro = program 

if (require.main === module) {
  // this module was run directly from the command line as in node xxx.js

  // const dir = path.join(__dirname, 'modules');
  // console.log('Dir= %s', dir);
  // require.main.paths.push(dir);  
  // console.log(require.main.paths);

  require('./import').modul.main(); // # require('./import/index').main();
} else {
  // this module was not run directly from the command line and probably loaded by something else
  const cmd = require('./import/commonjs'); // => require default to get object: cmd = program
  console.log(typeof cmd);
  cmd.show('Commander');

  const {program} = require('./import/es2017');  // => require module = {program,...} 
  console.log(stringify(program));
  program.show('Captain');

  console.log(stringify(pro));
  pro.show('Captain Pro');
}