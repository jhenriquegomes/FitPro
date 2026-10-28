const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// CRC32 implementation for standard PNG chunks
function createCrcTable() {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) {
        c = 0xedb88320 ^ (c >>> 1);
      } else {
        c = c >>> 1;
      }
    }
    table[n] = c;
  }
  return table;
}

const crcTable = createCrcTable();

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);

  const crcData = Buffer.concat([typeBuf, data]);
  const crc = crc32(crcData);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc, 0);

  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function generatePng(width, height, isMaskable = false) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // Bit depth: 8
  ihdrData[9] = 6; // Color type: RGBA (6)
  ihdrData[10] = 0; // Compression: Deflate
  ihdrData[11] = 0; // Filter method: Standard
  ihdrData[12] = 0; // Interlace: None
  const ihdr = makeChunk('IHDR', ihdrData);

  // Generate RGBA raster buffer
  // Each scanline has 1 filter byte (0) + width * 4 bytes
  const scanlineLength = 1 + width * 4;
  const rawData = Buffer.alloc(scanlineLength * height);

  const centerX = width / 2;
  const centerY = height / 2;
  const scale = width / 512;
  const safePadding = isMaskable ? 0.75 : 1.0; // Maskable icons keep symbol in 80% safe zone

  for (let y = 0; y < height; y++) {
    const rowOffset = y * scanlineLength;
    rawData[rowOffset] = 0; // Filter type 0 (None)

    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;

      // Distance from center
      const dx = x - centerX;
      const dy = y - centerY;
      const distFromCenter = Math.sqrt(dx * dx + dy * dy);

      // Background: Dark sleek circular/rounded rect
      let r = 14;
      let g = 20;
      let b = 25;
      let a = 255;

      // Corner rounding for standard (or solid fill for maskable)
      const cornerRadius = 90 * scale;
      const rx = Math.abs(dx) - (centerX - cornerRadius);
      const ry = Math.abs(dy) - (centerY - cornerRadius);
      if (!isMaskable && rx > 0 && ry > 0) {
        const cornerDist = Math.sqrt(rx * rx + ry * ry);
        if (cornerDist > cornerRadius) {
          a = 0; // transparent outside rounded corners
        }
      }

      if (a > 0) {
        // Subtle emerald radial glow in background
        const glowFactor = Math.max(0, 1 - distFromCenter / (220 * scale));
        r = Math.min(255, Math.round(r + 10 * glowFactor));
        g = Math.min(255, Math.round(g + 60 * glowFactor));
        b = Math.min(255, Math.round(b + 40 * glowFactor));

        // Outer border stroke
        if (!isMaskable && distFromCenter > (centerX - 4 * scale) && distFromCenter < centerX) {
          r = 16; g = 185; b = 129; // emerald-500
        }

        // Draw Barbells/Dumbbell geometry rotated -35 degrees
        // Rotate point (dx, dy) by +35 degrees to check in local dumbbell coords
        const angle = 35 * Math.PI / 180;
        const lx = (dx * Math.cos(angle) + dy * Math.sin(angle)) / safePadding;
        const ly = (-dx * Math.sin(angle) + dy * Math.cos(angle)) / safePadding;

        // Dumbbell Bar: lx between -120*scale and +120*scale, ly between -16*scale and +16*scale
        const barHalfW = 110 * scale;
        const barHalfH = 14 * scale;
        if (Math.abs(lx) <= barHalfW && Math.abs(ly) <= barHalfH) {
          // Metal grip
          r = 203; g = 213; b = 225; // slate-300
        }

        // Collars
        const collarOffset = 65 * scale;
        const collarW = 10 * scale;
        const collarH = 35 * scale;
        if ((Math.abs(lx - collarOffset) <= collarW || Math.abs(lx + collarOffset) <= collarW) && Math.abs(ly) <= collarH) {
          r = 16; g = 185; b = 129; // emerald-500
        }

        // Main Weight Plates
        const plate1Offset = 88 * scale;
        const plate1W = 16 * scale;
        const plate1H = 80 * scale;
        if ((Math.abs(lx - plate1Offset) <= plate1W || Math.abs(lx + plate1Offset) <= plate1W) && Math.abs(ly) <= plate1H) {
          r = 16; g = 185; b = 129; // emerald-500
        }

        // Secondary Outer Weight Plates
        const plate2Offset = 115 * scale;
        const plate2W = 12 * scale;
        const plate2H = 65 * scale;
        if ((Math.abs(lx - plate2Offset) <= plate2W || Math.abs(lx + plate2Offset) <= plate2W) && Math.abs(ly) <= plate2H) {
          r = 5; g = 150; b = 105; // emerald-600
        }
      }

      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  // Compress IDAT
  const compressed = zlib.deflateSync(rawData);
  const idat = makeChunk('IDAT', compressed);

  // IEND
  const iend = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

const publicDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1. pwa-192x192.png
const pwa192 = generatePng(192, 192, false);
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), pwa192);
console.log('Generated public/pwa-192x192.png');

// 2. pwa-512x512.png
const pwa512 = generatePng(512, 512, false);
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), pwa512);
console.log('Generated public/pwa-512x512.png');

// 3. pwa-maskable-512x512.png
const pwaMaskable512 = generatePng(512, 512, true);
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), pwaMaskable512);
console.log('Generated public/pwa-maskable-512x512.png');

// 4. apple-touch-icon.png (180x180)
const appleIcon = generatePng(180, 180, false);
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), appleIcon);
console.log('Generated public/apple-touch-icon.png');

// 5. favicon.ico (can also be a valid 64x64 PNG inside standard icon wrapper or 32x32 PNG)
const favicon = generatePng(32, 32, false);
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), favicon);
console.log('Generated public/favicon.ico');
