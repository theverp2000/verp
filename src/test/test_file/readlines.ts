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
      skip_empty_lines: true
    }));
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
  return [fields, records, badLines];
};

(async () => {
  const [fields, records, badLines] = await processFile(3);
  console.info(fields, records, badLines);
})();