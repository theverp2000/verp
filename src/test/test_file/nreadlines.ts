const nReadlines = require('n-readlines');
const broadbandLines = new nReadlines(__dirname + '/res.lang.csv');

let lineNumber = 1;
let line = broadbandLines.next();
console.log(`header: ${line}`);
while (line) {
  line = broadbandLines.next();
  console.log(`Line ${lineNumber} has: ${line}`);
  lineNumber++;
}

console.log('end of file.');
const used = process.memoryUsage().heapUsed / 1024 / 1024;
console.log(`The script uses approximately ${Math.round(used * 100) / 100} MB`);