import fs from 'fs';
import { parse as parseCsv} from 'csv-parse';

const fileName = __dirname + '/res.lang.csv';

const processFile = async (maxLines?: number): Promise<[any[], any[], any[]][]> => {
  let lineNumber = 0;
  let fields;
  const records: any[] = [];
  const badLines: any[] = [];
  const parser = fs
    .createReadStream(fileName)
    .pipe(parseCsv({
      skipEmptyLines: true
    }));
  const t0 = new Date();
  for await (const record of parser) {
    if (lineNumber == 0) {
      fields = record;
    } else {
      if (record.length != fields.length) {
        badLines.push([lineNumber, record]);
      }
      else {
        records.push(record);
      }
    }
    lineNumber++;
    if (maxLines && lineNumber > maxLines) {
      break;
    }
  }
  const t1 = new Date();
  console.log('Parse csv %s records in %s ms', lineNumber, t1.getTime() - t0.getTime());
  return [fields, records, badLines];
};

(async () => {
  const [fields, records, badLines] = await processFile();
  // console.info(fields, records, badLines);
})();