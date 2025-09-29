const events = require('events');
const fs = require('fs');
import readline from 'node:readline';

(async function processLineByLine() {
  const file = __dirname + '/res.lang.csv';
  try {
    console.log('Reading file line by line with readline done.');

    const rl = readline.createInterface({
      input: fs.createReadStream(file),
      crlfDelay: Infinity
    });

    rl.on('line', (line) => {
      console.log(`Line from file: ${line}`);
    });

    await events.once(rl, 'close');

    const used = process.memoryUsage().heapUsed / 1024 / 1024;
    console.log(`The script uses approximately ${Math.round(used * 100) / 100} MB`);
  } catch (err) {
    console.error(err);
  }
})();