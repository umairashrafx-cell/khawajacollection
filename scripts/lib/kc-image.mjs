/**
 * A PNG encoder and the KC monogram, shared by the Open Graph card and the
 * favicons so the two can never drift into being different marks.
 *
 * WHY THIS IS HAND-ROLLED. There is no image library in this project and Hard
 * Rule 7 forbids adding one without asking. A PNG is a zlib stream of filtered
 * scanlines wrapped in CRC32-checked chunks, and Node ships zlib, so the
 * encoder is about sixty lines. The monogram is drawn as geometry rather than
 * text because rasterising a font is the genuinely hard part and not worth
 * hand-rolling.
 *
 * THIS IS PLACEHOLDER BRANDING. Section 19 lists the KC logo as an asset Umair
 * must supply, including "a square mark for favicon/OG". When the real logo
 * arrives both generator scripts are deleted and the real files dropped in.
 */

import { deflateSync } from "node:zlib";

/* ------------------------------------------------------------------ */
/* PNG encoding                                                        */
/* ------------------------------------------------------------------ */

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buffer) {
  let c = 0xffffffff;
  for (let i = 0; i < buffer.length; i += 1) c = CRC_TABLE[(c ^ buffer[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const typeAndData = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeAndData));
  return Buffer.concat([length, typeAndData, crc]);
}

/** `pixels` is RGB, 3 bytes per pixel, row-major. */
export function encodePng(width, height, pixels) {
  const stride = width * 3;
  // Filter type 0 (None) per scanline. The image is flat colour in long runs,
  // so deflate does the work; a smarter filter would save little.
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y += 1) {
    raw[y * (stride + 1)] = 0;
    pixels.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type 2 = truecolour RGB
  ihdr[10] = 0; // deflate
  ihdr[11] = 0; // adaptive filtering
  ihdr[12] = 0; // no interlace

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/* ------------------------------------------------------------------ */
/* Palette — Section 6.1                                               */
/* ------------------------------------------------------------------ */

export const INK = [20, 17, 15];
export const SAND = [241, 236, 228];
export const GOLD = [176, 141, 87];

/* ------------------------------------------------------------------ */
/* The monogram                                                        */
/* ------------------------------------------------------------------ */

/**
 * Point-membership predicates for the letterforms, in a normalised space where
 * the cap height runs from -1 to 1 and x is centred on each letter.
 *
 * `weight` is the half-thickness of a stroke. It is a parameter because a mark
 * that reads correctly at 1200px is a grey smudge at 32px: small sizes need
 * proportionally heavier strokes, which is the oldest rule in type design and
 * the reason a favicon is not just a scaled-down logo.
 */
function letterK(px, py, weight) {
  if (Math.abs(py) > 1) return false;

  const stemLeft = -0.62;
  const stemRight = stemLeft + weight * 2;
  if (px >= stemLeft && px <= stemRight) return true;

  // Both arms hinge on the stem at the waist and open to the top and bottom
  // right. Letting them cross at the letter's centre draws an X with a bar.
  const t = stemRight + Math.abs(py) * 1.02;
  const half = weight * Math.hypot(1, 1.02);
  return px >= t - half && px <= t + half && px <= 0.66;
}

function letterC(px, py, weight) {
  const r = Math.hypot(px, py);
  const outer = 1.0;
  const inner = outer - weight * 2.4;
  if (r < inner || r > outer) return false;
  // Open the counter to the right, the way a C is drawn.
  return !(px > 0.28 && Math.abs(py) < 0.52);
}

/**
 * Renders the KC monogram centred on a ground.
 *
 * @param {object} o
 * @param {number} o.width
 * @param {number} o.height
 * @param {number[]} o.bg      background RGB
 * @param {number[]} o.fg      letterform RGB
 * @param {number} o.scale     cap height in pixels
 * @param {number} o.weight    stroke half-thickness, normalised
 * @param {number} [o.gap]     half the distance between letter centres, normalised
 * @param {number} [o.cy]      vertical centre in pixels
 * @param {(x:number,y:number)=>boolean} [o.accent] extra shape drawn in GOLD
 */
export function renderMonogram(o) {
  const { width, height, bg, fg, scale, weight, gap = 1.12, accent } = o;
  const cx = width / 2;
  const cy = o.cy ?? height / 2;
  const pixels = Buffer.alloc(width * height * 3);
  const offset = gap * scale;

  const SAMPLES = 4; // the diagonals and the arc need it
  const total = SAMPLES * SAMPLES;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let mark = 0;
      let gold = 0;

      for (let sy = 0; sy < SAMPLES; sy += 1) {
        for (let sx = 0; sx < SAMPLES; sx += 1) {
          const fx = x + (sx + 0.5) / SAMPLES;
          const fy = y + (sy + 0.5) / SAMPLES;
          const ny = (fy - cy) / scale;

          if (
            letterK((fx - (cx - offset)) / scale, ny, weight) ||
            letterC((fx - (cx + offset)) / scale, ny, weight)
          ) {
            mark += 1;
          } else if (accent?.(fx, fy)) {
            gold += 1;
          }
        }
      }

      const markA = mark / total;
      const goldA = gold / total;
      const i = (y * width + x) * 3;
      for (let c = 0; c < 3; c += 1) {
        const withGold = bg[c] + (GOLD[c] - bg[c]) * goldA;
        pixels[i + c] = Math.round(withGold + (fg[c] - withGold) * markA);
      }
    }
  }

  return pixels;
}

/* ------------------------------------------------------------------ */
/* ICO container                                                       */
/* ------------------------------------------------------------------ */

/**
 * Wraps PNGs in an .ico. Every browser that matters has accepted PNG-in-ICO
 * since Vista, and it avoids hand-rolling a second (BMP) encoder.
 *
 * @param {{size:number, png:Buffer}[]} images
 */
export function encodeIco(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // 1 = icon
  header.writeUInt16LE(images.length, 4);

  const entries = [];
  let dataOffset = 6 + images.length * 16;

  for (const { size, png } of images) {
    const entry = Buffer.alloc(16);
    // 0 means 256 in the ICO directory; nothing here is that large, but the
    // encoding rule is worth honouring rather than emitting a silent 0.
    entry[0] = size >= 256 ? 0 : size;
    entry[1] = size >= 256 ? 0 : size;
    entry[2] = 0; // palette size
    entry[3] = 0; // reserved
    entry.writeUInt16LE(1, 4); // colour planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(png.length, 8);
    entry.writeUInt32LE(dataOffset, 12);
    entries.push(entry);
    dataOffset += png.length;
  }

  return Buffer.concat([header, ...entries, ...images.map((i) => i.png)]);
}
