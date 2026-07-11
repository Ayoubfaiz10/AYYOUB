const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

async function main() {
  const svgPath = path.join(__dirname, '..', 'assets', 'logo.svg');
  const icoPath = path.join(__dirname, '..', 'icon.ico');
  const svg = fs.readFileSync(svgPath, 'utf8');

  const sizes = [256, 64, 32, 16];
  const pngBuffers = [];

  for (const size of sizes) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    const img = await loadImage(`data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`);
    ctx.drawImage(img, 0, 0, size, size);
    pngBuffers.push(canvas.toBuffer('image/png'));
  }

  // Build ICO
  const dirEntries = [];
  let offset = 6 + sizes.length * 16;
  for (let i = 0; i < sizes.length; i++) {
    const w = sizes[i] >= 256 ? 0 : sizes[i];
    const h = sizes[i] >= 256 ? 0 : sizes[i];
    const buf = Buffer.alloc(16);
    buf.writeUInt8(w, 0);
    buf.writeUInt8(h, 1);
    buf.writeUInt8(0, 2);
    buf.writeUInt8(0, 3);
    buf.writeUInt16LE(1, 4);
    buf.writeUInt16LE(32, 6);
    buf.writeUInt32LE(pngBuffers[i].length, 8);
    buf.writeUInt32LE(offset, 12);
    dirEntries.push(buf);
    offset += pngBuffers[i].length;
  }

  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(sizes.length, 4);

  const ico = Buffer.concat([header, ...dirEntries, ...pngBuffers]);
  fs.writeFileSync(icoPath, ico);
  console.log('icon.ico generated with sizes:', sizes.join('x, ') + 'x');
}

main().catch(err => { console.error(err); process.exit(1); });
