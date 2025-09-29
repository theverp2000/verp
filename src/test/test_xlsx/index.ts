import * as Excel from 'exceljs';

const fileExport = __dirname + '/Presidents.xlsx';
const fileImport = __dirname + '/PortfolioSummary.xls';

async function _export() {
  const url = "https://docs.sheetjs.com/executive.json";
  const rawData: any = await (await fetch(url)).json();
  console.log(typeof rawData);
  const prez: any[] = [];
  for (const row of rawData) {
    if (row.terms.some(term => term.type === "prez")) {
      prez.push(row);
    }
  }
  const rows = prez.map(row => ({
    name: row.name.first + " " + row.name.last,
    birthday: row.bio.birthday
  }));
  console.log(rows);
  // const worksheet = XLSX.utils.json_to_sheet(rows);
  // const workbook = XLSX.utils.book_new();
  // XLSX.utils.book_append_sheet(workbook, worksheet, "Dates");
  // XLSX.writeFile(workbook, fileExport, { compression: true });
}

async function _import() {
  // read from a file
  const workbook = new Excel.Workbook();
  await workbook.xlsx.readFile(fileImport);
  console.log(workbook.worksheets);

  // /* get first worksheet */
  // const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  // const raw_data = XLSX.utils.sheet_to_json(worksheet, {header:1});

  // /* fill years */
  // var last_year = 0;
  // raw_data.forEach(r => last_year = r[0] = (r[0] != null ? r[0] : last_year));

  // /* select data rows */
  // const rows = raw_data.filter(r => r[0] >= 2007 && r[0] <= 2024 && r[2] > 0);

  // /* generate row objects */
  // const objects = rows.map(r => ({FY: r[0], FQ: r[1], total: r[8]}));
  // console.log(objects);
}

_import();

export {}