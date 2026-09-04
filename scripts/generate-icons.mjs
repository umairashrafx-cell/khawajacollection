/**
 * Generates the favicon set from the KC monogram.
 *
 *   node scripts/generate-icons.mjs
 *
 * Writes:
 *   public/favicon.ico          16 + 32 + 48, for the browser tab
 *   public/icon-192.png         Android home screen / PWA
 *   public/icon-512.png         splash and store listings
 *   public/apple-touch-icon.png 180, iOS home screen
 *
 * TWO DESIGN DECISIONS WORTH KNOWING.
 *
 * 1. The favicon is INVERTED relative to the Open Graph card — light marks on
 *    the ink ground rather than dark on sand. A favicon sits in a tab strip
 *    a few pixels wide, usually against the browser's own light chrome, and a
 *    pale square with thin dark marks disappears into it. A dark tile reads as
 *    a solid shape at 16px and only then resolves into letters.
 *
 * 2. The strokes get heavier as the icon gets smaller. Scaling one drawing
 *    down turns a 1200px mark into a grey smudge at 16px; small sizes need
 *    proportionally more weight and more air between the letters. That is why
 *    `weight` and `gap` are parameters rather than constants.
 *
 * PLACEHOLDER until Umair supplies the real logo (Section 19), at which point
 * this script and scripts/generate-og-image.mjs are both deleted.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { INK, SAND, encodeIco, encodePng, renderMonogram } from "./lib/kc-image.mjs";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "public");

/**
 * Per-size tuning. Below ~48px the letters need more weight and more room
 * between them or they merge into a blob; above it the mark can be finer.
 *
 * `gap` is half the distance between letter centres, in cap heights. It has a
 * floor: the K reaches 0.66 to its right and the C reaches 1.0 to its left, so
 * a gap under ~0.83 makes them collide.
 */
function tuning(size) {
  if (size <= 20) return { scale: size * 0.2, weight: 0.22, gap: 1.1 };
  if (size <= 48) return { scale: size * 0.21, weight: 0.18, gap: 1.05 };
  return { scale: size * 0.21, weight: 0.15, gap: 1.0 };
}

/**
 * The drawn extent of the mark, in pixels.
 *
 * The first version of this script had no such check and silently clipped the
 * C against the right edge at every size — the letters were drawn from the
 * centre outwards with no idea how wide they ended up. Geometry that can
 * overflow its canvas should say so rather than crop.
 */
function markWidth({ scale, gap }) {
  // K's left edge (-0.62) to C's right edge (+1.0), plus the two offsets.
  return scale * (2 * gap + 1.62);
}

function mark(size) {
  const t = tuning(size);
  const drawn = markWidth(t);
  if (drawn > size * 0.92) {
    throw new Error(
      `${size}px icon: mark is ${drawn.toFixed(1)}px wide and would clip. ` +
        `Reduce scale or gap in tuning().`,
    );
  }

  return encodePng(
    size,
    size,
    renderMonogram({
      width: size,
      height: size,
      bg: INK,
      fg: SAND,
      scale: t.scale,
      weight: t.weight,
      gap: t.gap,
    }),
  );
}
mkdirSync(OUT, { recursive: true });

// A multi-size .ico so the browser picks the right one instead of downscaling
// the 48 into a 16 and smearing it.
const ico = encodeIco([16, 32, 48].map((size) => ({ size, png: mark(size) })));
writeFileSync(join(OUT, "favicon.ico"), ico);

const pngs = [
  ["icon-192.png", 192],
  ["icon-512.png", 512],
  ["apple-touch-icon.png", 180],
];

for (const [file, size] of pngs) {
  writeFileSync(join(OUT, file), mark(size));
}

console.log(`Wrote favicon.ico (${(ico.length / 1024).toFixed(1)} KB, 16/32/48)`);
for (const [file, size] of pngs) console.log(`      ${file.padEnd(22)} ${size}x${size}`);
