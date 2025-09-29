import cluster, { Address } from 'cluster';
import http from 'http';
import pro from 'process';

if (cluster.isPrimary) {

  // Keep track of http requests
  let numReqs = 0;
  // Keep alive
  // const timeout = setInterval(() => {
  //   console.log(`numReqs = ${numReqs}`);
  // }, 1000);

  // Count requests
  function messageHandler(msg, handle) {
    if (msg.cmd && msg.cmd === 'notifyRequest') {
      numReqs += 1;
      console.log(`(${this.id})messageHandler: numReqs = ${numReqs} from msg ${msg}`);
    }
  }

  function listeningHandler(address: Address) {
    console.log(`(${this.id})listeningHandler: on ${JSON.stringify(address)}`);
    this.send('shutdown');
    // auto shutdown
    this.disconnect();
    this.timeout = setTimeout(() => {
      this.kill();
    }, 2000);
  }

  function disconnectHandler() {
    console.log(`(${this.id})disconnectHandler`);
    clearTimeout(this.timeout);
  }

  function exitHandler(code: number, signal: string) {
    console.log(`(${this.id})exitHandler: code=${code} signal=${signal}`);
  }

  function errorHandler(error: Error) {
    console.log(`(${this.id})errorHandler: ${error.message}`);
  }

  // Start workers and listen for messages containing notifyRequest
  const numCPUs = require('node:os').cpus().length;
  for (let i = 1; i <= numCPUs; i++) {
    console.log(`cluster.fork(${i}/${numCPUs})`);
    cluster.fork();
  }

  for (const id in cluster.workers) {
    const worker = cluster.workers[id];
    if (worker) { 
      worker.on("message", messageHandler);
      worker.on("listening", listeningHandler);
      worker.on("disconnect", disconnectHandler);
      worker.on("exit", exitHandler);
      worker.on("error", errorHandler);
    }
  }

  cluster.on("exit", (worker) => {
    console.log("Worker", worker.id, "has exited.");
  });

  cluster.on("disconnect", (worker) => {
    console.log("Worker", worker.id, "has disconnected.");
  });
} else {

  // Worker processes have a http server.
  const server = new http.Server((req, res) => {
    res.writeHead(200);
    res.end('hello world\n');

    // Notify primary about the request
    const func = pro.send?.bind(pro);
    if (func) {
      func({ cmd: 'notifyRequest', id: process });
    }
  });
  server.listen(8000);
}