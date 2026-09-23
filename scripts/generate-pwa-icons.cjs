// scripts/generate-pwa-icons.cjs
// Generates valid PNG icons for PWA using pure Node.js (zlib + raw PNG chunk writing)
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// CRC32 table for PNG chunks
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) c = 0xedb88320 ^ (c >>> 1);
    else c = c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(12 + len);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const typeAndData = chunk.subarray(4, 8 + len);
  chunk.writeUInt32BE(crc32(typeAndData), 8 + len);
  return chunk;
}

function createPng(width, height, drawPixelFn) {
  // Raw image data with filter byte 0 at start of each scanline
  const rowSize = 1 + width * 4; // 1 filter byte + RGBA
  const raw = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    raw[rowOffset] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = drawPixelFn(x, y, width, height);
      const pxOffset = rowOffset + 1 + x * 4;
      raw[pxOffset] = r;
      raw[pxOffset + 1] = g;
      raw[pxOffset + 2] = b;
      raw[pxOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(raw, { level: 9 });

  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth: 8
  ihdr[9] = 6; // Color type: RGBA (6)
  ihdr[10] = 0; // Compression: Deflate
  ihdr[11] = 0; // Filter: Standard
  ihdr[12] = 0; // Interlace: None

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Draw GymPro ERP brand icon: Dark background, Orange emblem & Barbell
function drawGymProIcon(x, y, width, height, isMaskable = false) {
  const nx = x / width; // 0 to 1
  const ny = y / height; // 0 to 1
  const cx = 0.5;
  const cy = 0.5;
  const dist = Math.sqrt((nx - cx) ** 2 + (ny - cy) ** 2);

  // Background: Deep dark zinc gradient #09090b to #18181b
  const bgR = 9 + Math.floor(ny * 12);
  const bgG = 9 + Math.floor(ny * 12);
  const bgB = 11 + Math.floor(ny * 14);

  // Corner rounding for regular icons (not maskable which covers whole rect)
  if (!isMaskable) {
    const rx = Math.abs(nx - cx);
    const ry = Math.abs(ny - cy);
    const cornerThreshold = 0.38;
    if (rx > cornerThreshold && ry > cornerThreshold) {
      const cornerDist = Math.sqrt((rx - cornerThreshold) ** 2 + (ry - cornerThreshold) ** 2);
      if (cornerDist > 0.11) {
        return [0, 0, 0, 0]; // Transparent outside rounded corner
      }
    }
  }

  // Scale factor for safe zone: maskable has 15% margin
  const scale = isMaskable ? 0.72 : 0.88;
  const sx = (nx - cx) / scale;
  const sy = (ny - cy) / scale;

  // Background radial ambient glow
  const sDist = Math.sqrt(sx * sx + sy * sy);
  let r = bgR;
  let g = bgG;
  let b = bgB;
  let a = 255;

  if (sDist < 0.45) {
    const glow = Math.max(0, 1 - sDist / 0.45);
    r = Math.min(255, r + Math.floor(glow * 45));
    g = Math.min(255, g + Math.floor(glow * 20));
    b = Math.min(255, b + Math.floor(glow * 5));
  }

  // Barbell Bar in center: sy between -0.025 and 0.025, sx between -0.35 and 0.35
  if (Math.abs(sy) <= 0.025 && Math.abs(sx) <= 0.35) {
    return [228, 228, 231, 255]; // Metallic light gray
  }

  // Center Grip Collar: sx between -0.08 and 0.08, sy between -0.035 and 0.035
  if (Math.abs(sy) <= 0.035 && Math.abs(sx) <= 0.08) {
    return [161, 161, 170, 255]; // Metal collar
  }

  // Left & Right Weight Plates
  // Plate 1 (Outer heavy plate): |sx| between 0.16 and 0.21, |sy| <= 0.20
  if ((Math.abs(sx) >= 0.16 && Math.abs(sx) <= 0.21) && Math.abs(sy) <= 0.20) {
    // Orange plate
    return [249, 115, 22, 255]; // #f97316
  }

  // Plate 2 (Middle plate): |sx| between 0.23 and 0.27, |sy| <= 0.15
  if ((Math.abs(sx) >= 0.23 && Math.abs(sx) <= 0.27) && Math.abs(sy) <= 0.15) {
    return [251, 146, 60, 255]; // #fb923c
  }

  // Plate 3 (Outer small plate): |sx| between 0.29 and 0.32, |sy| <= 0.10
  if ((Math.abs(sx) >= 0.29 && Math.abs(sx) <= 0.32) && Math.abs(sy) <= 0.10) {
    return [194, 65, 12, 255]; // #c2410c
  }

  // Hexagon central badge in middle: sx, sy near center
  // Hexagon condition: |sx| * sqrt(3) + |sy| <= R
  const hexR = 0.13;
  if (Math.abs(sx) * 1.5 + Math.abs(sy) <= hexR * 1.5 && Math.abs(sx) <= hexR) {
    // Border of hexagon
    const borderDist = Math.abs(Math.abs(sx) * 1.5 + Math.abs(sy) - hexR * 1.5);
    if (borderDist < 0.02 || Math.abs(Math.abs(sx) - hexR) < 0.015) {
      return [249, 115, 22, 255]; // Orange border
    }
    // Inner badge: 'G' stylized shape
    // Horizontal bars and vertical left bar
    if (sx >= -0.06 && sx <= -0.03 && Math.abs(sy) <= 0.05) {
      return [255, 255, 255, 255]; // White letter 'G' left
    }
    if (Math.abs(sx) <= 0.06 && sy >= -0.06 && sy <= -0.03) {
      return [255, 255, 255, 255]; // White top bar
    }
    if (Math.abs(sx) <= 0.06 && sy >= 0.03 && sy <= 0.06) {
      return [255, 255, 255, 255]; // White bottom bar
    }
    if (sx >= 0.03 && sx <= 0.06 && sy >= 0.00 && sy <= 0.06) {
      return [255, 255, 255, 255]; // White right middle
    }
    if (sx >= 0.00 && sx <= 0.06 && Math.abs(sy - 0.005) <= 0.015) {
      return [255, 255, 255, 255]; // White middle spur
    }
    return [15, 15, 18, 255]; // Dark background inside hex
  }

  // Small ERP Dots below: sy around 0.28
  if (Math.abs(sy - 0.28) <= 0.015 && Math.abs(sx) <= 0.22) {
    // 3 Dots
    if (Math.abs(sx - 0) <= 0.02 || Math.abs(sx - 0.1) <= 0.02 || Math.abs(sx + 0.1) <= 0.02) {
      return [251, 146, 60, 255];
    }
  }

  return [r, g, b, a];
}

const publicDir = path.resolve(__dirname, '../public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

console.log('Generating PWA icons...');

// 1. 192x192
const icon192 = createPng(192, 192, (x, y, w, h) => drawGymProIcon(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), icon192);
console.log('Created pwa-192x192.png (192x192)');

// 2. 512x512
const icon512 = createPng(512, 512, (x, y, w, h) => drawGymProIcon(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), icon512);
console.log('Created pwa-512x512.png (512x512)');

// 3. Maskable 512x512 (Safe zone with 15% margin and full-bleed background)
const maskable512 = createPng(512, 512, (x, y, w, h) => drawGymProIcon(x, y, w, h, true));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), maskable512);
console.log('Created pwa-maskable-512x512.png (512x512 maskable)');

// 4. Apple Touch Icon 180x180 (PNG for iOS Safari)
const appleIcon = createPng(180, 180, (x, y, w, h) => drawGymProIcon(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), appleIcon);
console.log('Created apple-touch-icon.png (180x180)');

// 5. Favicon 48x48 PNG / ICO fallback
const favicon = createPng(48, 48, (x, y, w, h) => drawGymProIcon(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), favicon);
console.log('Created favicon.ico (48x48)');

console.log('All PWA icons generated successfully!');
