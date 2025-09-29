const http = require('http');
const busboy = require('busboy');
const getRawBody = require('raw-body');

const sampleBody = `
------WebKitFormBoundaryUQkarcmaQaGzV10s
Content-Disposition: form-data; name="data"

["/report/pdf/accounting.financial?options={"form":{"accountReportId":[4,"Balance Sheet"],"companyId":[1,"ProBike Inc"],"comparisonContext":{"journalIds":[1,2,3,4,7,6,5],"state":"posted"},"dateFrom":"2024-10-31T17:00:00.000Z","dateFromCmp":null,"dateTo":"2024-11-22T17:00:00.000Z","dateToCmp":null,"debitCredit":false,"enableFilter":false,"filterCmp":"filterNo","id":11,"journalIds":[1,2,3,4,7,6,5],"labelFilter":false,"targetMove":"posted","usedContext":{"companyId":1,"dateFrom":"2024-10-31T17:00:00.000Z","dateTo":"2024-11-22T17:00:00.000Z","journalIds":[1,2,3,4,7,6,5],"lang":"en_US","state":"posted","strictRange":true}},"ids":[],"model":"ir.ui.menu"}&context={"lang":"en_US","tz":"Asia/Bangkok","uid":2,"allowedCompanyIds":[1],"activeModel":"accounting.report","activeId":11,"activeIds":[11],"default_accountReportId":4,"discardLogoCheck":true}","qweb-pdf"]
------WebKitFormBoundaryUQkarcmaQaGzV10s
Content-Disposition: form-data; name="context"

{"lang":"en_US","tz":"Asia/Bangkok","uid":2,"allowedCompanyIds":[1]}
------WebKitFormBoundaryUQkarcmaQaGzV10s
Content-Disposition: form-data; name="token"

dummy-because-api-expects-one
------WebKitFormBoundaryUQkarcmaQaGzV10s
Content-Disposition: form-data; name="csrfToken"

69843e842333c0fff98ade7c652c889f529ac5dbo204771634
------WebKitFormBoundaryUQkarcmaQaGzV10s--
`;

async function getBody(request) {
  let body;
  if (request.headers['content-type']) {
    try {
      body = await getRawBody(request, {
        length: request.headers['content-length'],
        limit: '1mb',
        // encoding: contentType.parse(request).parameters.charset
      })
      // body = body.toString();
    } catch (e) {
      console.log(e.message);
    }
  }
  return body;
}

const RE_BOUNDARY =
  /^multipart\/.+?(?:; boundary=(?:(?:"(.+)")|(?:([^\s]+))))$/i;

http.createServer(async (req, res) => {
  let m;
  if (req.method === 'POST' && req.headers['content-type']
    && (m = RE_BOUNDARY.exec(req.headers['content-type']))) {
    const bb = busboy({ headers: req.headers });
    bb.on('file', (name, filestream, info) => {
      const { filename, encoding, mimeType } = info;
      console.log(
        `File [${name}]: filename: %s, encoding: %s, mimeType: %s`,
        filename,
        encoding,
        mimeType
      );
      // save to file
      // const saveTo = path.join(os.tmpdir(), `busboy-upload-${random()}`);
      // filestream.pipe(fs.createWriteStream(saveTo));

      filestream.on('data', (databuffer) => {
        console.log(`File [${name}] got ${databuffer.length} bytes`);
      }).on('close', () => {
        console.log(`File [${name}] done`);
      });
    });
    bb.on('field', (name, val, info) => {
      const { encoding, mimeType } = info;
      console.log(`Field [${name}]: value: %s`, val);
    });
    bb.on('close', () => {
      console.log('Done parsing form!');
      res.writeHead(303, { Connection: 'close', Location: '/' });
      res.end();
    });
    bb.on('error', (error) => {
      console.log(error);
    });
    req.pipe(bb);

    //
    let body = await getBody(req);
    if (body) {
      console.log('content-type:', req.headers['content-type']);
      // content-type: multipart/form-data; boundary=----WebKitFormBoundarygy1K3L3fDE8V99x3
      body = body.toString().replaceAll('+', '%2B');
      console.log('body');
      /**
      ------WebKitFormBoundarygy1K3L3fDE8V99x3
      Content-Disposition: form-data; name="filefield"; filename="hq720.jpg"
      Content-Type: image/jpeg

      [content of raw file]
      ------WebKitFormBoundarygy1K3L3fDE8V99x3
      Content-Disposition: form-data; name="textfield"

      avvds
      ------WebKitFormBoundarygy1K3L3fDE8V99x3--
       */
    }
  } else if (req.method === 'GET') {
    res.writeHead(200, { Connection: 'close' });
    res.end(`
      <html>
        <head></head>
        <body>
          <form method="POST" enctype="multipart/form-data">
            <input type="file" name="filefield"><br />
            <input type="text" name="textfield"><br />
            <input type="text" name="textfield"><br />
            <input type="submit">
          </form>
        </body>
      </html>
    `);
  }
}).listen(8000, () => {
  console.log(`Server listening on port http://localhost:8000/`);
});

// Example output:
//
// Listening for requests
//   < ... form submitted ... >
// POST request
// File [filefield]: filename: "logo.jpg", encoding: "binary", mime: "image/jpeg"
// File [filefield] got 11912 bytes
// Field [textfield]: value: "testing! :-)"
// File [filefield] done
// Done parsing form!