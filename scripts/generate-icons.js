// Generate simple PNG icons for Chrome extension
// Run: node generate-icons.js
// Creates solid colored circle icons with no external dependencies

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function createPNG(size, bgColor) {
  // Create RGBA pixel data - circle with "B" approximation
  const pixels = Buffer.alloc(size * size * 4, 0);
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - cx + 0.5;
      const dy = y - cy + 0.5;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const idx = (y * size + x) * 4;

      if (dist <= r) {
        // Inside circle - orange
        pixels[idx] = 0xE8;     // R
        pixels[idx + 1] = 0x61; // G
        pixels[idx + 2] = 0x4D; // B
        pixels[idx + 3] = 0xFF; // A
      }
    }
  }

  // Draw a simple "B" shape in white for larger sizes
  if (size >= 48) {
    const letterLeft = Math.round(size * 0.32);
    const letterRight = Math.round(size * 0.68);
    const letterTop = Math.round(size * 0.25);
    const letterBottom = Math.round(size * 0.75);
    const letterMid = Math.round(size * 0.5);
    const thickness = Math.max(2, Math.round(size * 0.08));

    // Draw white pixels for B shape
    for (let y = letterTop; y <= letterBottom; y++) {
      for (let x = letterLeft; x <= letterRight; x++) {
        let draw = false;
        // Left vertical bar
        if (x <= letterLeft + thickness) draw = true;
        // Top horizontal
        if (y <= letterTop + thickness && x <= letterRight - thickness) draw = true;
        // Middle horizontal
        if (Math.abs(y - letterMid) <= thickness / 2 && x <= letterRight - thickness) draw = true;
        // Bottom horizontal
        if (y >= letterBottom - thickness && x <= letterRight - thickness) draw = true;
        // Right curves (simplified as vertical bars)
        if (x >= letterRight - thickness) {
          if (y > letterTop + thickness && y < letterMid - thickness / 2) draw = true;
          if (y > letterMid + thickness / 2 && y < letterBottom - thickness) draw = true;
        }

        if (draw) {
          const idx = (y * size + x) * 4;
          pixels[idx] = 0xFF;
          pixels[idx + 1] = 0xFF;
          pixels[idx + 2] = 0xFF;
          pixels[idx + 3] = 0xFF;
        }
      }
    }
  } else if (size >= 16) {
    // For small icon, just draw a centered white dot/square
    const dotSize = Math.max(4, Math.round(size * 0.35));
    const start = Math.round((size - dotSize) / 2);
    for (let y = start; y < start + dotSize; y++) {
      for (let x = start; x < start + dotSize; x++) {
        // Simple B shape at small scale - vertical bar + bumps
        const relX = x - start;
        const relY = y - start;
        let draw = false;
        if (relX <= 1) draw = true; // left bar
        if (relY <= 0 || relY >= dotSize - 1 || relY === Math.floor(dotSize / 2)) {
          if (relX <= dotSize - 1) draw = true; // horizontals
        }
        if (relX >= dotSize - 2) {
          if (relY > 0 && relY < Math.floor(dotSize / 2)) draw = true;
          if (relY > Math.floor(dotSize / 2) && relY < dotSize - 1) draw = true;
        }
        if (draw) {
          const idx = (y * size + x) * 4;
          pixels[idx] = 0xFF;
          pixels[idx + 1] = 0xFF;
          pixels[idx + 2] = 0xFF;
          pixels[idx + 3] = 0xFF;
        }
      }
    }
  }

  // Build PNG file
  // Add filter byte (0 = None) before each row
  const rawData = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    rawData[y * (size * 4 + 1)] = 0; // filter: None
    pixels.copy(rawData, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }

  const compressed = zlib.deflateSync(rawData);

  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);  // width
  ihdr.writeUInt32BE(size, 4);  // height
  ihdr[8] = 8;   // bit depth
  ihdr[9] = 6;   // color type (RGBA)
  ihdr[10] = 0;  // compression
  ihdr[11] = 0;  // filter
  ihdr[12] = 0;  // interlace

  const chunks = [
    createChunk('IHDR', ihdr),
    createChunk('IDAT', compressed),
    createChunk('IEND', Buffer.alloc(0))
  ];

  return Buffer.concat([signature, ...chunks]);
}

function createChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);

  const typeBuffer = Buffer.from(type, 'ascii');
  const crcData = Buffer.concat([typeBuffer, data]);

  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcData), 0);

  return Buffer.concat([length, typeBuffer, data, crc]);
}

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      if (crc & 1) {
        crc = (crc >>> 1) ^ 0xEDB88320;
      } else {
        crc = crc >>> 1;
      }
    }
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

// Generate icons
const iconsDir = path.join(__dirname, 'icons');
if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir);

[16, 48, 128].forEach(size => {
  const png = createPNG(size);
  fs.writeFileSync(path.join(iconsDir, `icon${size}.png`), png);
  console.log(`Created icon${size}.png (${size}x${size})`);
});

console.log('Done! Icons saved to chrome-extension/icons/');
