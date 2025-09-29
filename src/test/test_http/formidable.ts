import http from 'node:http';
import formidable, {errors as formidableErrors} from 'formidable';

const server = http.createServer(async (req, res) => {
  if (req.url === '/api/upload' && req.method?.toLowerCase() === 'post') {
    // parse a file upload
    const form = formidable({});
    let fields;
    let files;
    try {
        [fields, files] = await form.parse(req);
    } catch (err) {
        // example to check for a very specific error
        if (err.code === formidableErrors.maxFieldsExceeded) {

        }
        console.error(err);
        res.writeHead(err.httpCode || 400, { 'Content-Type': 'text/plain' });
        res.end(String(err));
        return;
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ fields, files }, null, 2));
    return;
  }

  // show a file upload form
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`
    <h2>With Node.js <code>"http"</code> module</h2>
    <form action="/api/upload" enctype="multipart/form-data" method="post">
      <div>Text field title: <input type="text" name="title" /></div>
      <div>File: <input type="file" name="multipleFiles" multiple="multiple" /></div>
      <input type="submit" value="Upload" />
    </form>
  `);
});

server.listen(8080, () => {
  console.log('Server listening on http://localhost:8080/ ...');
});

/**
 * Result shows on web client
 * {
    "fields": {
      "title": [
        ""
      ]
    },
    "files": {
      "multipleFiles": [
        {
          "size": 740043,
          "filepath": "C:\\Users\\Admin\\AppData\\Local\\Temp\\96dfbfd1d04da4363f9206800",
          "newFilename": "96dfbfd1d04da4363f9206800",
          "mimetype": "image/png",
          "mtime": "2024-05-30T01:51:20.830Z",
          "originalFilename": "Untitled.png"
        },
        {
          "size": 208839,
          "filepath": "C:\\Users\\Admin\\AppData\\Local\\Temp\\96dfbfd1d04da4363f9206801",
          "newFilename": "96dfbfd1d04da4363f9206801",
          "mimetype": "image/jpeg",
          "mtime": "2024-05-30T01:51:20.835Z",
          "originalFilename": "apple.jpg"
        }
      ]
    }
  }
 */