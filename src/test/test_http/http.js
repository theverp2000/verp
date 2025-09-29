const http = require("http");
const url = require('url');
const fs = require('fs');
const path = require('path');
const port = process.argv[2] || 9000;
const host = 'localhost';

const root = __dirname;
// const requestListener = function (req, res) {};
// const server = http.createServer(requestListener);
// server.listen(port, host, () => {
//     console.log(`Server is running on http://${host}:${port}`);
// });


http.createServer(function (req, res) {
  console.log(`${req.method} ${req.url}`);

  // parse URL
  const parsedUrl = url.parse(req.url);
  // extract URL path
  let pathname = `.${parsedUrl.pathname}`;
  // based on the URL path, extract the file extension. e.g. .js, .doc, ...
  const ext = path.parse(pathname).ext;
  // maps file extension to MIME typere
  const map = {
    '.ico': 'image/x-icon',
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.css': 'text/css',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.wav': 'audio/wav',
    '.mp3': 'audio/mpeg',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword'
  };

  pathname = path.normalize(`${root}${path.sep}${pathname}`);
  console.log('file', pathname);
  fs.open(pathname, 'r', (err, fd) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // if the file is not found, return 404
        res.statusCode = 404;
        res.end(`File ${pathname} not found!`);
        return;
      }
  
      throw err;
    }
  
    try {
        // if is a directory search for index file matching the extension
        if (fs.statSync(pathname).isDirectory()) pathname += '/index' + ext;
        // read file from file system
        fs.readFile(pathname, function(err, data) {
            if (err) {
                res.statusCode = 500;
                res.end(`Error getting the file: ${err}.`);
            } else {
                // Website you wish to allow to connect
                res.setHeader('Access-Control-Allow-Origin', '*');

                // Request methods you wish to allow
                res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

                // Request headers you wish to allow
                res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

                // Set to true if you need the website to include cookies in the requests sent
                // to the API (e.g. in case you use sessions)
                res.setHeader('Access-Control-Allow-Credentials', true);

                // if the file is found, set Content-type and send data
                res.setHeader('Content-type', map[ext] || 'text/plain' );
                res.end(data);
            }
        });
    } finally {
        fs.close(fd, (err) => {
            if (err) throw err;
        });
    }
  });

}).listen(parseInt(port));

console.log(`Server listening on port http://${host}:${port}/lang_ar.png`);