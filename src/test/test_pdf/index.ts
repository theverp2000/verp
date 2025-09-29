
// https://blog.risingstack.com/pdf-from-html-node-js-puppeteer/
import { writeFile } from 'fs/promises';
// import * as xml from '../../core/tools/xml';
import puppeteer, { Page } from 'puppeteer';

const API_URL = 'http://localhost';
const fileName = __dirname + '/file.pdf';
const fileName2 = __dirname + '/file2.pdf';

async function loginPDF(page: Page) {
  await page.type('#email', process.env.PDF_USER || '');
  await page.type('#password', process.env.PDF_PASSWORD || '');
  await page.click('#submit');
  await page.addStyleTag({ content: '.nav { display: none} .navbar { border: 0px} #print-button {display: none}' })
}
/** 
async function mockupPDF(page: Page) {
  // await page.addStyleTag({ content: '.nav { display: none} .navbar { border: 0px} #print-button {display: none}' });
  const oldContent = await page.content();
  const doc = xml.parseHtml(oldContent);
  // const title = xpath.select1("//*[local-name(.)='title']", doc) as Element;
  const name = xpath.select1("//*[@href='news']", doc) as Element;
  if (name && name.firstChild) {
    (name.firstChild as Element).textContent = 'TONY CHANGED';
  }
  let str = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          html, body {
            height: 100vh;
            margin: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            background: #fafafa;
          }
          img {
            max-width: 60%;
            box-shadow: 3px 3px 6px #eee;
            border-radius: 6px;
          }
        </style>
      </head>
      <body>
        <!-- img src="data:img/png;base64,{screenshot.toString('base64')}"-->
        HELLO
      </body>
    </html>
  `;
  const newContent = xml.serializeHtml(doc);
  page.setContent(newContent);
}
**/

async function printPDF() {
  const browser = await puppeteer.launch({
    executablePath: "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    headless: true,
    args: ["--fast-start", "--disable-extensions", "--no-sandbox"],
    // ignoreHTTPSErrors: true
  });

  const page = await browser.newPage();
  await page.goto('https://news.ycombinator.com', { waitUntil: 'networkidle0' });
  // await mockupPDF(page);
  const header = `<footer style="margin: auto; width: 40%">
    <img style="float: left; marginRight: 8px; marginLeft: 36px; width: 25%" src="data:image/png;base64,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" alt="Pivohub" />
    <p style="font-family: arial; float: right; width: 55%; color: red; margin-top: 24px; font-size: 10px">
        <b>My footer</b>
    </p>
  </footer>`;
  const pdf = await page.pdf({
    // path: fileName, // write to
    format: 'A4',
    headerTemplate: header,
    footerTemplate:
      `<div class="footer">
          Page <span class="pageNumber" style="font-size: 30px; width: 50px; height: 50px; background-color: red; color:black; margin: 20px;"></span> of <span class="totalPages"></span>
      </div>`,
    margin: {
      top: "300px",
      left: "20px",
      right: "20px",
      bottom: "100px"
    }
  });
  await browser.close();
  return pdf;
}

async function printPDF2() {
  const logo = `data:image/png;base64,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`;

  const header = `<header style='margin-left: 10px; margin-top: -10px; width: 40%;'>
        <img style="float: left; margin-right: 10px; width: 40%" src="${logo}" alt="TheVerp" />
        <p style="font-family: arial; float: right; width: 55%; color: yellow; margin-top: 0px; font-size: 10px">
            <b>My header</b>
        </p>
    </header>`;

  const footer = '<footer><span style="font-size: 10px"> <span class="pageNumber"></span> of <span class="totalPages"></span></span></footer>';

  const content = `<!DOCTYPE html>
        <html>
            <head>
                <meta charSet="utf-8"/>
                <style type="text/css">
                    body { backgroundColor: "red" }
                </style>
            </head>
            <body>
                <h1>Hello</h1>
            </body>
        </html>`

  const browser = await puppeteer.launch({
    executablePath: "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    headless: true,
    args: ["--fast-start", "--disable-extensions", "--no-sandbox"],
  });

  const page = await browser.newPage();
  await page.goto('https://news.ycombinator.com', { waitUntil: 'networkidle0' });
  // await page.setContent(content, { waitUntil: "networkidle0" })
  const pdf = await page.pdf({
    format: "A4",
    displayHeaderFooter: true,
    headerTemplate: header, // default: datetime, title
    footerTemplate: footer, // default: link, pages
    margin: { top: "50px", bottom: "50px" }, // margin of content
    printBackground: true,
  });
  await browser.close();
  return pdf;
}

/*
function getPDF() {
  const url = `${API_URL}/file.pdf`;
  const options = {
    responseType: 'arraybuffer',
    headers: {
      'Accept': 'application/pdf'
    }
  }

  return new Promise<any>((resolve, reject) => {
    const req = http.request(url, options, (res: any) => {
      if (res.statusCode < 200 || res.statusCode >= 300) {
        return reject(new Error('statusCode=' + res.statusCode));
      }
      let body: any = [];
      res.on('data', function (chunk) {
        body.push(chunk);
      });
      res.on('end', function () {
        try {
          if (res.headers["content-type"] == 'application/json') {
            body = JSON.parse(Buffer.concat(body).toString());
          }
        } catch (e) {
          reject(e);
        }
        resolve(body);
      });
    });
    req.on('error', (e) => {
      reject(e.message);
    });
    req.end();
  });
}

function savePDF() {
  this.openModal('Loading…'); // open modal
  return getPDF() // API call
    .then((response) => {
      const blob = new Blob([response.data], {type: 'application/pdf'})
      const link = document.createElement('a')
      link.href = window.URL.createObjectURL(blob)
      link.download = `your-file-name.pdf`
      link.click()
      this.closeModal() // close modal
    })
 .catch(err => {throw err});
}
*/
async function main() {
  console.log('Start pdf');
  const pdf = await printPDF2();
  console.log('get pdf len=%s save to%s', pdf.byteLength, fileName);
  await writeFile(fileName, pdf);
  console.log('wrote pdf %s', fileName);
  // await readPDF(fileName);
}

main();