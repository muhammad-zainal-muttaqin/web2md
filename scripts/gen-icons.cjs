const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function crc32(buf) {
  const table = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    table[n] = c >>> 0;
  }
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function inRoundedRect(x, y, w, h, r) {
  if (x < r && y < r) return Math.hypot(r - x, r - y) <= r;
  if (x >= w - r && y < r) return Math.hypot(x - (w - 1 - r), r - y) <= r;
  if (x < r && y >= h - r) return Math.hypot(r - x, y - (h - 1 - r)) <= r;
  if (x >= w - r && y >= h - r) return Math.hypot(x - (w - 1 - r), y - (h - 1 - r)) <= r;
  return true;
}

function drawText(pixels, w, h, size) {
  const text = 'md';
  const fontW = Math.round(size * 0.5);
  const fontH = Math.round(size * 0.34);
  const startX = Math.round((w - fontW * text.length) / 2);
  const startY = Math.round((h - fontH) / 2);
  const strokeW = Math.max(1, Math.round(size * 0.085));
  const halfStroke = Math.floor(strokeW / 2);

  function isOnStroke(x, y, char) {
    if (char === 'm') {
      const lx = startX;
      const cx1 = startX + fontW * 0.33;
      const cx2 = startX + fontW * 0.66;
      const rx = startX + fontW;
      const top = startY;
      const mid = startY + fontH * 0.55;
      const bot = startY + fontH;
      const inV = (px, py1, py2) => Math.abs(x - px) <= halfStroke && y >= py1 - halfStroke && y <= py2 + halfStroke;
      const inH = (py, px1, px2) => Math.abs(y - py) <= halfStroke && x >= px1 - halfStroke && x <= px2 + halfStroke;
      if (inV(lx, top, bot)) return true;
      if (inV(rx, top, bot)) return true;
      if (inH(top, lx, rx)) return true;
      const ldx = (mid - top) / (cx1 - lx || 1);
      const ldy = cx1 - lx;
      if (y >= top && y <= mid && x >= lx && x <= cx1) {
        const expectedX = lx + (y - top) * (cx1 - lx) / (mid - top);
        if (Math.abs(x - expectedX) <= halfStroke) return true;
      }
      if (y >= top && y <= mid && x >= cx1 && x <= cx2) {
        const expectedX = cx1 + (y - top) * (cx2 - cx1) / (mid - top);
        if (Math.abs(x - expectedX) <= halfStroke) return true;
      }
      if (inH(mid, lx, rx)) return true;
      return false;
    }
    if (char === 'd') {
      const lx = startX + fontW;
      const rx = startX + fontW * 1.65;
      const top = startY;
      const bot = startY + fontH;
      const inV = (px, py1, py2) => Math.abs(x - px) <= halfStroke && y >= py1 - halfStroke && y <= py2 + halfStroke;
      const inH = (py, px1, px2) => Math.abs(y - py) <= halfStroke && x >= px1 - halfStroke && x <= px2 + halfStroke;
      if (inV(rx, top, bot)) return true;
      const cx = (lx + rx) / 2;
      const cy = (top + bot) / 2;
      const a = (rx - lx) / 2;
      const b = (bot - top) / 2;
      const nx = (x - cx) / a;
      const ny = (y - cy) / b;
      const dist = Math.sqrt(nx * nx + ny * ny);
      if (dist >= 0.78 && dist <= 0.78 + (halfStroke / Math.min(a, b))) return true;
      return false;
    }
    return false;
  }

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let on = false;
      for (let i = 0; i < text.length; i++) {
        const tx = startX + i * fontW;
        if (x >= tx && x < tx + fontW) {
          const localX = x - tx;
          on = isOnStroke(localX, y, text[i]);
          if (on) break;
        }
      }
      if (on) {
        const i = (y * w + x) * 4;
        pixels[i] = 255;
        pixels[i + 1] = 255;
        pixels[i + 2] = 255;
        pixels[i + 3] = 255;
      }
    }
  }
}

function makePng(size) {
  const w = size, h = size;
  const pixels = Buffer.alloc(w * h * 4);
  const r1 = 30, g1 = 64, b1 = 175;
  const r2 = 96, g2 = 165, b2 = 250;
  const radius = Math.floor(size * 0.22);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (!inRoundedRect(x, y, w, h, radius)) {
        pixels[i + 3] = 0;
        continue;
      }
      const t = (x + y) / (w + h);
      pixels[i] = Math.round(r1 + (r2 - r1) * t);
      pixels[i + 1] = Math.round(g1 + (g2 - g1) * t);
      pixels[i + 2] = Math.round(b1 + (b2 - b1) * t);
      pixels[i + 3] = 255;
    }
  }

  drawText(pixels, w, h, size);

  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const raw = Buffer.alloc(h * (w * 4 + 1));
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0;
    pixels.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  }
  const idat = zlib.deflateSync(raw);

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const outDir = path.join(__dirname, '..', 'icons');
fs.mkdirSync(outDir, { recursive: true });
for (const size of [16, 32, 48, 128]) {
  const png = makePng(size);
  const out = path.join(outDir, `icon-${size}.png`);
  fs.writeFileSync(out, png);
  console.log(`wrote ${out} (${png.length} bytes)`);
}
