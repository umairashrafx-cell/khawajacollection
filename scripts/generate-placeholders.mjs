/**
 * Generates the local placeholder imagery for Khawaja Collection.
 * See docs/BUILD-SPEC.pdf Section 6.4 and Phase 1 item 4.
 *
 *   node scripts/generate-placeholders.mjs
 *
 * Neutral beige/sand blocks carrying a subtle KC monogram, written as SVG so
 * they cost nothing to ship and need no image dependency. Every file is
 * generated locally — nothing is fetched, hotlinked, or borrowed.
 *
 * Aspect ratios are fixed by the spec and must not drift:
 *   3:4   product imagery (enforced everywhere, no exceptions)
 *   4:5   category cards, mobile editorial
 *   16:9  desktop editorial banners
 *
 * These are scaffolding. They get replaced by real photography from the
 * n8n + KIE.ai pipeline (spec Section 19) before launch.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "placeholders");

/** Sand tones drawn from the KC palette (spec Section 6.1). */
const TONES = [
  { bg: "#F1ECE4", ink: "#14110F" },
  { bg: "#EAE3D8", ink: "#14110F" },
  { bg: "#E8DCC2", ink: "#14110F" },
  { bg: "#E4E0D9", ink: "#14110F" },
  { bg: "#F5F1EA", ink: "#14110F" },
  { bg: "#DED5C6", ink: "#14110F" },
];

const RATIOS = {
  "3x4": { w: 900, h: 1200 },
  "4x5": { w: 960, h: 1200 },
  "16x9": { w: 1920, h: 1080 },
};

/**
 * One placeholder: a flat sand ground, a hairline inset border, and the KC
 * monogram at low opacity. Depth comes from the hairline, not a shadow —
 * same rule the real design system follows.
 */
function svg({ w, h, bg, ink, label }) {
  const monogram = Math.round(Math.min(w, h) * 0.16);
  const caption = Math.round(Math.min(w, h) * 0.028);
  const inset = Math.round(Math.min(w, h) * 0.045);
  const rule = Math.round(w * 0.06);
  const cy = h / 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="Khawaja Collection placeholder">
  <rect width="${w}" height="${h}" fill="${bg}"/>
  <rect x="${inset}" y="${inset}" width="${w - inset * 2}" height="${h - inset * 2}" fill="none" stroke="${ink}" stroke-opacity="0.12" stroke-width="1"/>
  <line x1="${w / 2 - rule}" y1="${cy - monogram * 0.85}" x2="${w / 2 + rule}" y2="${cy - monogram * 0.85}" stroke="#B08D3F" stroke-opacity="0.5" stroke-width="1"/>
  <text x="${w / 2}" y="${cy}" text-anchor="middle" dominant-baseline="middle" font-family="Cormorant Garamond, Georgia, serif" font-size="${monogram}" letter-spacing="${monogram * 0.08}" fill="${ink}" fill-opacity="0.22">KC</text>
  <text x="${w / 2}" y="${cy + monogram * 1.15}" text-anchor="middle" font-family="Inter, Helvetica, Arial, sans-serif" font-size="${caption}" letter-spacing="${caption * 0.18}" fill="${ink}" fill-opacity="0.35">${label.toUpperCase()}</text>
</svg>
`;
}

/** Deterministic tone per filename, so regenerating never reshuffles the set. */
function toneFor(name) {
  let hash = 2166136261;
  for (let i = 0; i < name.length; i += 1) {
    hash ^= name.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return TONES[Math.abs(hash) % TONES.length];
}

function write(name, ratio, label) {
  const { w, h } = RATIOS[ratio];
  const { bg, ink } = toneFor(name);
  const file = `${name}-${ratio}.svg`;
  writeFileSync(join(OUT_DIR, file), svg({ w, h, bg, ink, label }), "utf8");
  return file;
}

const CATEGORY_CARDS = ["women", "men", "unstitched", "ready-to-wear", "bridal", "accessories"];

const COLLECTIONS = ["the-new-season", "wedding-season", "everyday-essentials", "summer-lawn"];

mkdirSync(OUT_DIR, { recursive: true });

const written = [];

// Product imagery — a pool the catalogue draws from deterministically.
for (let i = 1; i <= 12; i += 1) {
  written.push(write(`product-${String(i).padStart(2, "0")}`, "3x4", "Product image"));
}

// Category cards (Section 11.1 item 3) and the two mega-menu promo tiles.
for (const slug of CATEGORY_CARDS) written.push(write(`category-${slug}`, "4x5", slug));
written.push(write("nav-women", "4x5", "Women"));
written.push(write("nav-men", "4x5", "Men"));

// Editorial banners: 16:9 desktop, 4:5 mobile (Section 6.4).
for (let i = 1; i <= 3; i += 1) {
  const name = `editorial-${String(i).padStart(2, "0")}`;
  written.push(write(name, "16x9", "Editorial"));
  written.push(write(name, "4x5", "Editorial"));
}

// Hero — the LCP element gets its own crop per breakpoint.
written.push(write("hero", "16x9", "Khawaja Collection"));
written.push(write("hero", "4x5", "Khawaja Collection"));

// Collection heroes.
for (const slug of COLLECTIONS) written.push(write(`collection-${slug}`, "16x9", slug));

// Open Graph card — 1200x630 is close enough to 16:9 to reuse the ratio.
written.push(write("og", "16x9", "Khawaja Collection"));

console.log(`Wrote ${written.length} placeholders to public/placeholders/`);
