const http = require("http");

const host = 'localhost';
const port = 8000;

const requestListener = function (req, res) {
  const _res = new http.ServerResponse(req);
  _res.setHeader("Content-Type", "text/html");
  _res.writeHead(200);
  _res.end(`<html><body><h1>This is HTML</h1></body></html>`);
};

const server = http.createServer(requestListener);
server.listen(port, host, () => {
    console.log(`Server is running on http://${host}:${port}`);
});
