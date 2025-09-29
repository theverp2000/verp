import fs from "fs";
import sharp from "sharp";
import ico from "sharp-ico";
import bmp from "sharp-bmp";

export function position(x: number, y: number, width: number, channel: number) {
  return ((y * width) + x) * channel;
}

export function getPixel(x: number, y: number, source: any={}) {
  const width = source.width;
  const depth = source.depth;
  const cCount = depth / 8;

  // Get start index of the specified pixel
  const i = position(x, y, width, cCount);
  const pixels = source.data;
  const b = pixels[i];
  const g = pixels[i + 1];
  const r = pixels[i + 2];
  const a = pixels[i + 3]; // a

  return [r,g,b,a];
}

function convert1() {
  const buffer = fs.readFileSync(__dirname + '/favicon.ico');
  const icons = ico.decode(buffer);

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
  // const meta1 = await image.metadata();
  return image
    // If the image has alpha transparency channel
    .flatten({ background: "#ffffff" })
    // If the image has no alpha transparency channel
    .ensureAlpha()
    .raw();
  // .then((data: Buffer) => {
  //   return data.toString('base64');
  // });
  // const bitmap = {
  //   data,
  //   width: info.width,
  //   height: info.height,
  // };
  // const raw = bmp.encode(bitmap);

  // image.toFile(__dirname + `/out/output-${icon.width}x${icon.height}.png`);
}

async function convert2(image) {
  return new Promise(function (resolve, reject) {
    image.toBuffer({ resolveWithObject: true }).then(({ data, info }) => {
      resolve(data.toString('base64'));
    });
  });
}

async function adjust() {
  const buffer = fs.readFileSync(__dirname + '/favicon.ico');
  const icons = ico.decode(buffer);

  const icon = icons[0];
  const image = icon.type === "png"
    ? sharp(icon.data)
    : sharp(icon.data, {
        raw: {
          width: icon.width,
          height: icon.height,
          channels: 4,
        },
      });
  const meta = await image.metadata();
  const { data, info } = await image
    // If the image has alpha transparency channel
    .flatten({ background: "#ffffff" })
    // If the image has no alpha transparency channel
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });


  image.toFile(__dirname + `/out/output-${icon.width}x${icon.height}.png`);
}

async function main() {
  const image = convert1();
  const str = await convert2(image);
  console.log(str);
}

main();

export {}