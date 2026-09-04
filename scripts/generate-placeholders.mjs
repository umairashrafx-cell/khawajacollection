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

/* ------------------------------------------------------------------ */
/* Bedsheets                                                           */
/* ------------------------------------------------------------------ */

/**
 * BEDDING GETS ITS OWN DRAWING, NOT THE KC BLOCK.
 *
 * Every other placeholder here is a flat sand panel with a monogram, and for
 * clothing that is honest scaffolding - nobody mistakes it for a photograph.
 * A bedsheet listing is different: the whole product IS the pattern and the
 * drape, so a category of twelve identical beige squares tells you nothing
 * about whether the page works. These draw a top-down made bed instead -
 * ground, sheet, pattern, two pillows, a folded throw - so the grid, the
 * colour swatches and the 3:4 frame can all be judged against something that
 * behaves like the real thing.
 *
 * Still scaffolding. Still generated locally, still SVG, still no dependency,
 * still due to be replaced by real photography (Section 19).
 */
const BED_PATTERNS = ["stripe", "check", "dot", "trellis", "plain"];

/** The pattern itself, as a <pattern> def. `ink` is the motif colour. */
function bedPattern(id, kind, ink) {
  const line = `stroke="${ink}" stroke-opacity="0.28" fill="none"`;
  switch (kind) {
    case "stripe":
      return `<pattern id="${id}" width="34" height="34" patternUnits="userSpaceOnUse">
      <line x1="0" y1="0" x2="0" y2="34" ${line} stroke-width="7"/>
    </pattern>`;
    case "check":
      return `<pattern id="${id}" width="46" height="46" patternUnits="userSpaceOnUse">
      <line x1="0" y1="0" x2="0" y2="46" ${line} stroke-width="5"/>
      <line x1="0" y1="0" x2="46" y2="0" ${line} stroke-width="5"/>
    </pattern>`;
    case "dot":
      return `<pattern id="${id}" width="40" height="40" patternUnits="userSpaceOnUse">
      <circle cx="20" cy="20" r="5" fill="${ink}" fill-opacity="0.3"/>
    </pattern>`;
    case "trellis":
      return `<pattern id="${id}" width="52" height="52" patternUnits="userSpaceOnUse">
      <path d="M0 26 L26 0 L52 26 L26 52 Z" ${line} stroke-width="3"/>
    </pattern>`;
    default:
      // "plain" is a real choice, not a fallback: a plain percale sheet is a
      // thing people buy, and one undecorated tile in the grid proves the
      // card still reads without a motif carrying it.
      return `<pattern id="${id}" width="10" height="10" patternUnits="userSpaceOnUse"></pattern>`;
  }
}

/**
 * A made bed seen from above. Composed rather than photographed, so the
 * proportions are fixed by fractions of the frame and hold at any ratio.
 */
function bedSvg({ w, h, bg, ink, sheet, motif, pattern, label }) {
  const id = `p-${pattern}-${Math.round(w)}`;
  const m = Math.round(w * 0.1);
  const bedW = w - m * 2;
  const bedTop = Math.round(h * 0.13);
  const bedH = Math.round(h * 0.74);
  const radius = Math.round(w * 0.012);
  const pillowH = Math.round(bedH * 0.15);
  const pillowW = Math.round((bedW - m * 0.6) / 2);
  const pillowY = bedTop + Math.round(bedH * 0.04);
  const throwY = bedTop + Math.round(bedH * 0.62);
  const throwH = Math.round(bedH * 0.19);
  const caption = Math.round(Math.min(w, h) * 0.026);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="Khawaja Collection bedsheet placeholder">
  <defs>
    ${bedPattern(id, pattern, motif)}
  </defs>
  <rect width="${w}" height="${h}" fill="${bg}"/>

  <rect x="${m}" y="${bedTop}" width="${bedW}" height="${bedH}" rx="${radius}" fill="${sheet}"/>
  <rect x="${m}" y="${bedTop}" width="${bedW}" height="${bedH}" rx="${radius}" fill="url(#${id})"/>
  <rect x="${m}" y="${bedTop}" width="${bedW}" height="${bedH}" rx="${radius}" fill="none" stroke="${ink}" stroke-opacity="0.16" stroke-width="1"/>

  <rect x="${m + Math.round(m * 0.3)}" y="${pillowY}" width="${pillowW - Math.round(m * 0.3)}" height="${pillowH}" rx="${Math.round(pillowH * 0.28)}" fill="${bg}" fill-opacity="0.85" stroke="${ink}" stroke-opacity="0.14" stroke-width="1"/>
  <rect x="${m + pillowW + Math.round(m * 0.3)}" y="${pillowY}" width="${pillowW - Math.round(m * 0.3)}" height="${pillowH}" rx="${Math.round(pillowH * 0.28)}" fill="${bg}" fill-opacity="0.85" stroke="${ink}" stroke-opacity="0.14" stroke-width="1"/>

  <rect x="${m}" y="${throwY}" width="${bedW}" height="${throwH}" fill="${ink}" fill-opacity="0.07"/>
  <line x1="${m}" y1="${throwY}" x2="${m + bedW}" y2="${throwY}" stroke="${ink}" stroke-opacity="0.18" stroke-width="1"/>
  <line x1="${m}" y1="${throwY + throwH}" x2="${m + bedW}" y2="${throwY + throwH}" stroke="${ink}" stroke-opacity="0.18" stroke-width="1"/>

  <text x="${w / 2}" y="${h - Math.round(h * 0.045)}" text-anchor="middle" font-family="Inter, Helvetica, Arial, sans-serif" font-size="${caption}" letter-spacing="${caption * 0.18}" fill="${ink}" fill-opacity="0.4">${label.toUpperCase()}</text>
</svg>
`;
}

/** Sheet grounds, drawn from the same palette as the colour filter. */
const BED_TONES = [
  { sheet: "#F3EFE7", motif: "#1E2A44", label: "Ivory" },
  { sheet: "#E3D9C6", motif: "#6E2637", label: "Sand" },
  { sheet: "#D8C9B2", motif: "#3A3633", label: "Beige" },
  { sheet: "#E4E9EA", motif: "#256C74", label: "Teal" },
  { sheet: "#E7E4EA", motif: "#1E2A44", label: "Navy" },
  { sheet: "#E9E3DE", motif: "#1F5B45", label: "Emerald" },
];

function writeBed(name, ratio, index, label) {
  const { w, h } = RATIOS[ratio];
  const { bg, ink } = toneFor(name);
  const tone = BED_TONES[index % BED_TONES.length];
  const pattern = BED_PATTERNS[index % BED_PATTERNS.length];
  const file = `${name}-${ratio}.svg`;
  writeFileSync(
    join(OUT_DIR, file),
    bedSvg({ w, h, bg, ink, sheet: tone.sheet, motif: tone.motif, pattern, label }),
    "utf8",
  );
  return file;
}

const CATEGORY_CARDS = [
  "women",
  "men",
  "unstitched",
  "ready-to-wear",
  "bridal",
  "accessories",
  "bedsheets",
  "sale",
];

const COLLECTIONS = ["the-new-season", "wedding-season", "everyday-essentials", "summer-lawn"];

mkdirSync(OUT_DIR, { recursive: true });

const written = [];

// Product imagery — a pool the catalogue draws from deterministically.
for (let i = 1; i <= 12; i += 1) {
  written.push(write(`product-${String(i).padStart(2, "0")}`, "3x4", "Product image"));
}

// Bedsheet imagery - its own pool, drawn rather than blocked out. See the
// note above bedSvg.
for (let i = 1; i <= 12; i += 1) {
  const tone = BED_TONES[(i - 1) % BED_TONES.length];
  written.push(writeBed(`bedsheet-${String(i).padStart(2, "0")}`, "3x4", i - 1, tone.label));
}
written.push(writeBed("nav-bedsheets", "4x5", 0, "Bedsheets"));

// Category cards (Section 11.1 item 3) and the two mega-menu promo tiles.
for (const slug of CATEGORY_CARDS) {
  written.push(
    slug === "bedsheets"
      ? writeBed(`category-${slug}`, "4x5", 3, slug)
      : write(`category-${slug}`, "4x5", slug),
  );
}
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
