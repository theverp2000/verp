const { workerData, parentPort } = require('worker_threads');

const parse = (msg) => {
  console.log('Toi day 2')
  return 'Hello me!';
  // parentPort?.postMessage({ welcome: workerData });
}

module.exports = parse;