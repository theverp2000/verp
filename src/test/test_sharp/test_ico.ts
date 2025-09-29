import fs from 'fs';
import sharp from 'sharp';
import ico from 'sharp-ico';

const fileInput = __dirname + '/favicon.ico';
const fileOutput = __dirname + '/favicon2.ico';

async function main() {
  const input = fs.readFileSync(fileInput);

  const icons = ico.decode(input);
  const icon = icons[0];
  let image = icon.type === "png"
    ? sharp(icon.data)
    : sharp(icon.data, {
      raw: {
        width: icon.width,
        height: icon.height,
        channels: 4,
      },
    });
  image = image
    // If the image has alpha transparency channel
    .flatten({ background: "#ffffff" })
    // If the image has no alpha transparency channel
    .ensureAlpha()
    .raw();

  const output = await image.toBuffer();
  fs.writeFileSync(fileOutput, output);
}

main();