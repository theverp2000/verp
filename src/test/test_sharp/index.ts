import sharp from 'sharp';

let width = 100;
let height = 25;
let label = "Loooooooooong Text"; // "Medium Text" "Short"

const svg = Buffer.from(`
<svg width="${width}" height="${height}" viewBox="0 0 ${height} ${height + 2}">
  <defs>
    <font-face>
      <font-face-src>
        <font-face-uri href="file:///.../DejaVuSans.svg"/>
      </font-face-src>
    </font-face>
  </defs>
  <!--this rect should have rounded corners-->
  <rect x="0" y="0" width="100%" height="100%" fill="#fff"/>
  <text x="50%" y="50%" text-anchor="middle" dy="0.25em" fill="#000" stroke="#000" stroke-width="0" font-size="24" font-family="ITCGothicBold.ttf">${label}</text>
</svg>
`);

let image = sharp({
    create: {
        width: width,
        height: height,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 },
    }
})
  .composite([{
    input: svg,
    top: 0,
    left: 0,
}])
  .png()
  .toBuffer(); // .toFile('sample.png');

