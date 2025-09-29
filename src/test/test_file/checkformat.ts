import * as fs from 'fs';
import sharp from 'sharp';

async function main() {
  console.log('Before process');
  // read binary data
  const data = fs.readFileSync(__dirname + '/410.svg');
  const base64Source = data.toString('base64');
  if (! base64Source || base64Source[0] === 'P') {
    console.log('SVG file', base64Source[0]);
    return;
  }
  const s = sharp(base64Source);
  s.metadata().then((metadata) => console.log(metadata));
  console.log('After process');
};

console.log('Before main');
main();
console.log('After main');
