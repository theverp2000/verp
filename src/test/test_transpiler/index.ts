import { transpileJavascript, urlToModulePath } from "./trans";

import http from "http";
import fs from 'fs';

const host = 'localhost';
const port = 8000;

const requestListener = async function (req, res) {
    const contents = fs.readFileSync(__dirname + "\\input.js").toString();
    const indexFile = transpileJavascript('web/static/lib/abc', contents);
    res.setHeader("Content-Type", "application/javascript");
    res.writeHead(200);
    res.end(indexFile);
};

const server = http.createServer(requestListener);

async function main() {
    try {
        console.log(urlToModulePath('web/static/src/one/two/three.js'));
        console.log(urlToModulePath('web/static/lib/abc'));
        server.listen(port, host, () => {
            console.log(`Server is running on http://${host}:${port}`);
        });
    } catch(err) {
        console.error(`Could not read index.html file: ${err}`);
        process.exit(1);
    }
}

main();