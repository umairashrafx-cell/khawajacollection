/**
 * Generates the 1200x630 Open Graph card. docs/BUILD-SPEC.pdf Section 13.
 *
 *   node scripts/generate-og-image.mjs
 *
 * WHY THIS WRITES A PNG BY HAND. Section 13 requires a 1200x630 Open Graph
 * image, and the social crawlers that consume it do not render SVG — Facebook
 * and X both drop an SVG card silently, which is the worst failure mode
 * because the markup looks correct and the preview is just blank. So it has to
 * be a raster format. There is no image library in this project and Hard Rule 7
 * forbids adding one without asking, so the encoder is here: a PNG is a zlib
 * stream of filtered scanlines wrapped in CRC32-checked chunks, and Node ships
 * both zlib and everything else needed.
 *
 * WHY THERE IS NO TEXT ON IT. Drawing text means rasterising a font, which is
 * genuinely the hard part and not worth hand-rolling. The card is therefore
 * built from geometry: the KC ground colour, a gold rule, and the monogram as
 * filled shapes. That is honest scaffolding rather than a fake logo.
 *
 * THIS IS A PLACEHOLDER. Section 19 lists the KC logo as an asset Umair must
 * supply, including "a square mark for favicon/OG". When that arrives, this
 * script is deleted and the real card is dropped at public/og/. It is tracked
 * in docs/LAUNCH-CHECKLIST.md.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { GOLD, INK, SAND, encodePng } from "./lib/kc-image.mjs";

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "og");
const WIDTH = 1200;
const HEIGHT = 630;
/* ------------------------------------------------------------------ */
/* Drawing                                                             */
/* ------------------------------------------------------------------ */

/**
 * Per-pixel shape membership rather than polygon scanline filling. At 756,000
 * pixels and a handful of shapes this is instant, and it makes anti-aliasing a
 * matter of sampling rather than edge maths.
 */
function render() {
  const pixels = Buffer.alloc(WIDTH * HEIGHT * 3);

  const cx = WIDTH / 2;
  const cy = HEIGHT / 2 - 18;
  const scale = 150;

  // K: a vertical stem and two diagonal arms. C: an annulus with a wedge
  // removed on the right. Both expressed as predicates over a point.
  const inK = (x, y) => {
    const px = (x - (cx - 168)) / scale;
    const py = (y - cy) / scale;
    if (Math.abs(py) > 1) return false;

    const stemLeft = -0.62;
    const stemRight = -0.4;
    if (px >= stemLeft && px <= stemRight) return true;

    // Both arms HINGE ON THE STEM at the waist and open out to the top and
    // bottom right. Letting them cross at the letter's centre instead draws
    // an X with a bar through it, which is what the first attempt did.
    const t = stemRight + Math.abs(py) * 1.02;
    // Widened by the slope so a diagonal reads at the same weight as the
    // vertical stem rather than looking thinner.
    const halfWidth = 0.11 * Math.hypot(1, 1.02);
    return px >= t - halfWidth && px <= t + halfWidth && px <= 0.66;
  };

  const inC = (x, y) => {
    const px = (x - (cx + 168)) / scale;
    const py = (y - cy) / scale;
    const r = Math.hypot(px, py);
    if (r < 0.72 || r > 1.0) return false;
    // Open the counter towards the right, the way a C is drawn.
    return !(px > 0.28 && Math.abs(py) < 0.52);
  };

  const goldRule = (x, y) => Math.abs(y - (cy + 232)) <= 2 && Math.abs(x - cx) <= 190;

  // Hairline frame, inset, so the card reads as deliberate on a white feed.
  const frame = (x, y) => {
    const inset = 40;
    const onEdge =
      (x >= inset &&
        x <= WIDTH - inset &&
        (Math.abs(y - inset) <= 1 || Math.abs(y - (HEIGHT - inset)) <= 1)) ||
      (y >= inset &&
        y <= HEIGHT - inset &&
        (Math.abs(x - inset) <= 1 || Math.abs(x - (WIDTH - inset)) <= 1));
    return onEdge;
  };

  const SAMPLES = 3; // 3x3 supersampling; the diagonals and the arc need it.
  for (let y = 0; y < HEIGHT; y += 1) {
    for (let x = 0; x < WIDTH; x += 1) {
      let ink = 0;
      let gold = 0;
      for (let sy = 0; sy < SAMPLES; sy += 1) {
        for (let sx = 0; sx < SAMPLES; sx += 1) {
          const px = x + (sx + 0.5) / SAMPLES;
          const py = y + (sy + 0.5) / SAMPLES;
          if (inK(px, py) || inC(px, py)) ink += 1;
          else if (goldRule(px, py) || frame(px, py)) gold += 1;
        }
      }

      const total = SAMPLES * SAMPLES;
      const inkA = ink / total;
      const goldA = gold / total;

      const offset = (y * WIDTH + x) * 3;
      for (let c = 0; c < 3; c += 1) {
        const base = SAND[c];
        const withGold = base + (GOLD[c] - base) * goldA;
        pixels[offset + c] = Math.round(withGold + (INK[c] - withGold) * inkA);
      }
    }
  }

  return pixels;
}

mkdirSync(OUT_DIR, { recursive: true });
const file = join(OUT_DIR, "khawaja-collection.png");
writeFileSync(file, encodePng(WIDTH, HEIGHT, render()));
console.log(`Wrote ${file} (${WIDTH}x${HEIGHT})`);
