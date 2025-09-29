import * as fs from 'fs';
import sharp from 'sharp';

async function main() {
  console.log('Before process');
  // read binary data
  const data = fs.readFileSync(__dirname + '/res_company_logo.png');
  const s = sharp(data);
  s.rotate()
    .resize(200)
    .jpeg({ mozjpeg: true })
    .toFile(__dirname + '/res_company_logo_new.jpeg', (err, info) => { 
      console.log(err); 
    });
  s.metadata().then((metadata) => console.log(metadata));
  // console.log(data.subarray(0, 10));
  // for (const val of data.subarray(0, 10).values()) {
  //   console.log(val);
  // }
  // convert binary data to base64 encoded string
  // const str64 = Buffer.from(data).toString('base64');//'data:image/png;base64,' + 
  // console.log(str64.slice(0, 10));
  // const str2 = BigInt('0x' + data.toString('hex'));//.toString(2).padStart(data.length * 8, '0');
  // console.log(str2);
  // const out =  Buffer.from(str64, 'base64');
  // console.log(out.subarray(0, 10));
  // for (const val of out.subarray(0, 10).values()) {
  //   console.log(val);
  // }
  // fs.writeFileSync(__dirname + '/res_company_logo_new.png', out);
  console.log('After process');
};

console.log('Before main');
main();
console.log('After main');
