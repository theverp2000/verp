const http = require("http");

const host = 'localhost';
const port = 8000;

class ThreadHttp {
  requestListener = function (req, res) {
    console.log(server,req,res);
    res.setHeader("Content-Type", "application/json");
    res.writeHead(200);
    res.end(`{"message": "This is a JSON response"}`);
  };
}
const app = new ThreadHttp();

const server = http.createServer(app.requestListener);
server.listen(port, host, () => {
    console.log(`Server is running on http://${host}:${port}`);
});