import sharp from "sharp";
import { writeFileSync, mkdirSync } from "node:fs";

mkdirSync("public/icons", { recursive: true });

const svg = (size) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FDF1F4"/>
      <stop offset="100%" stop-color="#E8607A"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="80" fill="url(#g)"/>
  <text x="256" y="320" text-anchor="middle"
        font-family="-apple-system, system-ui, sans-serif"
        font-size="220" font-weight="800"
        letter-spacing="-12" fill="#FFFFFF">k</text>
</svg>`;

for (const sz of [192, 512]) {
  const buf = await sharp(Buffer.from(svg(sz)))
    .resize(sz, sz)
    .png()
    .toBuffer();
  writeFileSync(`public/icons/icon-${sz}.png`, buf);
  console.log(`wrote public/icons/icon-${sz}.png (${buf.length} bytes)`);
}

const maskable = `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FDF1F4"/>
      <stop offset="100%" stop-color="#E8607A"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#g)"/>
  <text x="256" y="305" text-anchor="middle"
        font-family="-apple-system, system-ui, sans-serif"
        font-size="170" font-weight="800"
        letter-spacing="-8" fill="#FFFFFF">k</text>
</svg>`;
const mbuf = await sharp(Buffer.from(maskable)).resize(512, 512).png().toBuffer();
writeFileSync("public/icons/icon-maskable-512.png", mbuf);
console.log(`wrote public/icons/icon-maskable-512.png (${mbuf.length} bytes)`);
