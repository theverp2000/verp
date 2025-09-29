import path from 'path';

import {Worker, isMainThread, parentPort, workerData } from 'worker_threads';

if (isMainThread) { // main
  module.exports = function parseJSAsync(script) {
    return new Promise((resolve, reject) => {
      const worker = new Worker(__filename, {
        workerData: script,
      });
      worker.on('message', resolve);
      worker.on('error', reject);
      worker.on('exit', (code) => {
        if (code !== 0)
          reject(new Error(`Worker stopped with exit code ${code}`));
      });
    });
  };
} else { // branch
  const file = path.join(__dirname, 'workerExample.js');
  console.log('file', file);
  const { parse } = require(file);
  const script = workerData;
  parentPort?.postMessage(parse(script));
}

/*
function runService(workerData) {
  return new Promise((resolve, reject) => {
    const file = path.join(__dirname, 'workerExample.js');
    console.log('file', file)
    const worker = new Worker(file, workerData);
    worker.on('message', resolve);
    worker.on('error', reject);
    worker.on('exit', (code) => {
      if (code !== 0)
        reject(new Error(`stopped with ${code} exit code`));
    });
  });
}

async function run() {
  const result = await runService('hello node.js')
  console.log(result);
}

run().catch(err => console.error(err))
*/