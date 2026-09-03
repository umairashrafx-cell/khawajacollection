/**
 * The Khawaja Collection catalogue. See docs/BUILD-SPEC.pdf Phase 1 item 3.
 *
 * Mock data for Phases 1–7. Phase 8 replaces this file with the `products`,
 * `product_images` and `product_variants` tables; the `Product` shape it
 * produces must not change.
 *
 * HOW TO ADD A PRODUCT
 * Append a row to `seeds` below. Nothing else needs editing and no React code
 * is involved. Every derived field — slug, images, variants, SKUs, stock,
 * rating, dates — is generated from the row by `buildProduct`.
 *
 * Everything here is invented for the prototype: names, copy and prices are
 * original to KC and are placeholders for the real catalogue (spec Section 19).
 * Price bands follow Phase 1: unstitched 2,500–12,000, ready-to-wear
 * 3,500–18,000, bridal 45,000–250,000. Formals, shawls and accessories have no
 * band in the spec, so they sit between ready-to-wear and bridal.
 */

import { colors as COLOR_TOKENS } from "@/config/filters";
import type { Product, ProductImage, ProductVariant } from "@/types";

/* ------------------------------------------------------------------ */
/* Size runs                                                           */
/* ------------------------------------------------------------------ */

/** Section 16 — ready-to-wear runs XS–XXL. */
const RTW = ["XS", "S", "M", "L", "XL", "XXL"];
const MENS = ["S", "M", "L", "XL", "XXL"];
/** Section 16 — unstitched is a single variant. */
const UNSTITCHED = ["Unstitched"];
const ONE_SIZE = ["One Size"];
const KHUSSA = ["36", "37", "38", "39", "40"];

/* ------------------------------------------------------------------ */
/* Seed rows — the editable catalogue                                  */
/* ------------------------------------------------------------------ */

interface Seed {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  /** Integer PKR. Never a float. */
  price: number;
  /** Integer PKR, must be below `price`. */
  sale?: number;
  fabric: string;
  pieces?: number;
  /** Colour values from src/config/filters.ts. First one is the hero colour. */
  colors: string[];
  sizes: string[];
  tags: string[];
  collections?: string[];
  featured?: boolean;
  isNew?: boolean;
  best?: boolean;
  /** Section 16 — bridal is made to order; PDP swaps in "Enquire on WhatsApp". */
  madeToOrder?: boolean;
  /** Max 160 chars. Doubles as the meta description, so keep every one unique. */
  blurb: string;
}

const seeds: Seed[] = [
  /* --- Women / Unstitched --------------------------------------------- */
  {
    id: "kc-w-001",
    name: "Noor Ivory Embroidered Lawn 3 Piece",
    category: "women",
    subcategory: "women-unstitched",
    price: 6800,
    sale: 5400,
    fabric: "Lawn",
    pieces: 3,
    colors: ["ivory", "sand"],
    sizes: UNSTITCHED,
    tags: ["unstitched", "everyday", "embroidered"],
    collections: ["summer-lawn", "the-new-season"],
    isNew: true,
    blurb:
      "Fine ivory lawn with tonal thread work across the neckline, packed as a full three-piece set with dyed trouser and printed dupatta.",
  },
  {
    id: "kc-w-002",
    name: "Zara Sand Printed Lawn 2 Piece",
    category: "women",
    subcategory: "women-unstitched",
    price: 4200,
    fabric: "Lawn",
    pieces: 2,
    colors: ["sand", "beige"],
    sizes: UNSTITCHED,
    tags: ["unstitched", "everyday", "printed"],
    collections: ["summer-lawn"],
    blurb:
      "A soft geometric print on sand lawn, cut generously so your tailor has room to work. Shirt and trouser length included.",
  },
  {
    id: "kc-w-003",
    name: "Meher Rose Chikankari Lawn 3 Piece",
    category: "women",
    subcategory: "women-unstitched",
    price: 9200,
    sale: 6900,
    fabric: "Lawn",
    pieces: 3,
    colors: ["rose", "ivory"],
    sizes: UNSTITCHED,
    tags: ["unstitched", "festive", "embroidered"],
    collections: ["summer-lawn"],
    best: true,
    blurb:
      "Hand-worked chikankari on dusty rose lawn. Open white embroidery that reads as texture rather than pattern, with a matching chiffon dupatta.",
  },
  {
    id: "kc-w-004",
    name: "Ayla Teal Khaddar 2 Piece",
    category: "women",
    subcategory: "women-unstitched",
    price: 5100,
    fabric: "Khaddar",
    pieces: 2,
    colors: ["teal", "navy"],
    sizes: UNSTITCHED,
    tags: ["unstitched", "everyday", "winter"],
    blurb:
      "Heavier khaddar in a deep teal, woven for the cold months. Warm enough to wear alone, plain enough to layer.",
  },
  {
    id: "kc-w-005",
    name: "Sahar Emerald Embroidered Lawn 3 Piece",
    category: "women",
    subcategory: "women-unstitched",
    price: 11500,
    fabric: "Lawn",
    pieces: 3,
    colors: ["emerald", "gold"],
    sizes: UNSTITCHED,
    tags: ["unstitched", "festive", "embroidered"],
    collections: ["summer-lawn", "wedding-season"],
    featured: true,
    blurb:
      "Dense emerald embroidery with a fine gold outline, worked on lawn light enough for daytime events. Three pieces, fully finished.",
  },
  {
    id: "kc-w-006",
    name: "Inaya Ivory Cotton 1 Piece",
    category: "women",
    subcategory: "women-unstitched",
    price: 2900,
    fabric: "Cotton",
    pieces: 1,
    colors: ["ivory"],
    sizes: UNSTITCHED,
    tags: ["unstitched", "everyday"],
    blurb:
      "A single length of plain ivory cotton. The quiet starting point for a shirt you already have the dupatta for.",
  },
  {
    id: "kc-w-007",
    name: "Rida Charcoal Khaddar 3 Piece",
    category: "women",
    subcategory: "women-unstitched",
    price: 7400,
    sale: 5900,
    fabric: "Khaddar",
    pieces: 3,
    colors: ["charcoal", "grey"],
    sizes: UNSTITCHED,
    tags: ["unstitched", "winter", "everyday"],
    blurb:
      "Charcoal khaddar with a self-woven stripe, matched to a wool-blend shawl. Built for a Lahore January.",
  },
  {
    id: "kc-w-008",
    name: "Hania Beige Slub Lawn 2 Piece",
    category: "women",
    subcategory: "women-unstitched",
    price: 3800,
    fabric: "Lawn",
    pieces: 2,
    colors: ["beige", "sand"],
    sizes: UNSTITCHED,
    tags: ["unstitched", "everyday"],
    collections: ["summer-lawn"],
    isNew: true,
    blurb:
      "Slub-textured lawn in warm beige. The irregular weave does the work, so we left the surface plain.",
  },
  {
    id: "kc-w-009",
    name: "Bakhtawar Maroon Embroidered Lawn 3 Piece",
    category: "women",
    subcategory: "women-unstitched",
    price: 10800,
    sale: 8100,
    fabric: "Lawn",
    pieces: 3,
    colors: ["maroon", "gold"],
    sizes: UNSTITCHED,
    tags: ["unstitched", "festive", "embroidered"],
    collections: ["wedding-season"],
    blurb:
      "Deep maroon lawn carrying a full embroidered front panel and gold piping, with organza sleeves cut to match.",
  },
  {
    id: "kc-w-010",
    name: "Sana Grey Printed Cotton 2 Piece",
    category: "women",
    subcategory: "women-unstitched",
    price: 3400,
    fabric: "Cotton",
    pieces: 2,
    colors: ["grey", "ivory"],
    sizes: UNSTITCHED,
    tags: ["unstitched", "everyday", "printed"],
    blurb:
      "A small repeating motif on grey cotton. Everyday cloth that survives the wash and keeps its colour.",
  },

  /* --- Women / Ready to Wear ------------------------------------------ */
  {
    id: "kc-w-011",
    name: "Mahnoor Ivory Cotton Kurta",
    category: "women",
    subcategory: "women-ready-to-wear",
    price: 4200,
    fabric: "Cotton",
    pieces: 1,
    colors: ["ivory", "sand"],
    sizes: RTW,
    tags: ["ready-to-wear", "everyday"],
    collections: ["everyday-essentials"],
    best: true,
    blurb:
      "A straight ivory kurta with side slits and a plain round neck. The one you reach for when you have not decided yet.",
  },
  {
    id: "kc-w-012",
    name: "Zoya Navy Linen Co-ord",
    category: "women",
    subcategory: "women-ready-to-wear",
    price: 8900,
    sale: 6700,
    fabric: "Linen",
    pieces: 2,
    colors: ["navy", "charcoal"],
    sizes: RTW,
    tags: ["ready-to-wear", "everyday"],
    collections: ["everyday-essentials", "the-new-season"],
    blurb:
      "Washed navy linen shirt and wide trouser, sold together. Creases are part of the cloth, not a fault in it.",
  },
  {
    id: "kc-w-013",
    name: "Areeba Rose Cambric Kurta",
    category: "women",
    subcategory: "women-ready-to-wear",
    price: 4800,
    fabric: "Cotton",
    pieces: 1,
    colors: ["rose"],
    sizes: RTW,
    tags: ["ready-to-wear", "everyday"],
    collections: ["everyday-essentials"],
    isNew: true,
    blurb:
      "Dusty rose cambric with a placket of covered buttons and a slightly dropped shoulder. Softer than it photographs.",
  },
  {
    id: "kc-w-014",
    name: "Fajar Emerald Khaddar Kurta",
    category: "women",
    subcategory: "women-ready-to-wear",
    price: 5600,
    fabric: "Khaddar",
    pieces: 1,
    colors: ["emerald", "teal"],
    sizes: RTW,
    tags: ["ready-to-wear", "winter", "everyday"],
    blurb:
      "Emerald khaddar cut long with a centre pleat. Weighted enough to hold its line through a full day.",
  },
  {
    id: "kc-w-015",
    name: "Laiba Sand Cotton Co-ord",
    category: "women",
    subcategory: "women-ready-to-wear",
    price: 9400,
    fabric: "Cotton",
    pieces: 2,
    colors: ["sand", "beige"],
    sizes: RTW,
    tags: ["ready-to-wear", "everyday"],
    collections: ["everyday-essentials", "the-new-season"],
    featured: true,
    blurb:
      "A sand cotton set: boxy shirt, straight trouser, no embellishment anywhere. Shape carries it.",
  },
  {
    id: "kc-w-016",
    name: "Minal Black Linen Shirt",
    category: "women",
    subcategory: "women-ready-to-wear",
    price: 6200,
    sale: 4650,
    fabric: "Linen",
    pieces: 1,
    colors: ["black", "charcoal"],
    sizes: RTW,
    tags: ["ready-to-wear", "everyday"],
    collections: ["everyday-essentials"],
    blurb:
      "Black linen, long line, high slit. Wears equally well over a shalwar or a plain trouser.",
  },
  {
    id: "kc-w-017",
    name: "Anaya Gold Jacquard Kurta",
    category: "women",
    subcategory: "women-ready-to-wear",
    price: 12800,
    fabric: "Jacquard",
    pieces: 1,
    colors: ["gold", "ivory"],
    sizes: RTW,
    tags: ["ready-to-wear", "festive"],
    collections: ["the-new-season"],
    best: true,
    blurb:
      "Woven gold jacquard in a fine damask. Dressed enough for an evening, plain enough for an afternoon.",
  },
  {
    id: "kc-w-018",
    name: "Sidra Teal Cotton Kurta",
    category: "women",
    subcategory: "women-ready-to-wear",
    price: 4400,
    fabric: "Cotton",
    pieces: 1,
    colors: ["teal"],
    sizes: RTW,
    tags: ["ready-to-wear", "everyday"],
    collections: ["everyday-essentials"],
    blurb:
      "Teal cotton with a mandarin collar and quarter placket. Cut straight, hemmed below the knee.",
  },
  {
    id: "kc-w-019",
    name: "Wania Ivory Silk Blend Co-ord",
    category: "women",
    subcategory: "women-ready-to-wear",
    price: 16500,
    sale: 12400,
    fabric: "Silk",
    pieces: 2,
    colors: ["ivory", "sand"],
    sizes: RTW,
    tags: ["ready-to-wear", "festive"],
    collections: ["the-new-season", "wedding-season"],
    featured: true,
    blurb:
      "A silk-blend shirt and trouser with a low sheen rather than a shine. Reserved enough for a daytime nikkah.",
  },
  {
    id: "kc-w-020",
    name: "Hoorain Grey Khaddar Kurta",
    category: "women",
    subcategory: "women-ready-to-wear",
    price: 5200,
    fabric: "Khaddar",
    pieces: 1,
    colors: ["grey"],
    sizes: RTW,
    tags: ["ready-to-wear", "winter", "everyday"],
    isNew: true,
    blurb:
      "Marled grey khaddar with patch pockets and a straight hem. Made for the weeks either side of winter.",
  },

  /* --- Women / Formals ------------------------------------------------ */
  {
    id: "kc-w-021",
    name: "Mehrunisa Ivory Organza Formal",
    category: "women",
    subcategory: "women-formals",
    price: 24500,
    fabric: "Organza",
    pieces: 3,
    colors: ["ivory", "gold"],
    sizes: RTW,
    tags: ["ready-to-wear", "festive", "wedding", "embroidered"],
    collections: ["wedding-season"],
    featured: true,
    blurb:
      "Ivory organza worked with restrained gold thread along the hem and cuffs, lined throughout, with a dyed slip and dupatta.",
  },
  {
    id: "kc-w-022",
    name: "Zainab Emerald Chiffon 3 Piece",
    category: "women",
    subcategory: "women-formals",
    price: 28900,
    sale: 21600,
    fabric: "Chiffon",
    pieces: 3,
    colors: ["emerald", "gold"],
    sizes: RTW,
    tags: ["ready-to-wear", "festive", "wedding", "embroidered"],
    collections: ["wedding-season"],
    best: true,
    blurb:
      "Emerald chiffon with a fully embroidered bodice and scattered motifs down the sleeve. Finished with a gold-edged dupatta.",
  },
  {
    id: "kc-w-023",
    name: "Shanzay Rose Raw Silk Formal",
    category: "women",
    subcategory: "women-formals",
    price: 19800,
    fabric: "Silk",
    pieces: 2,
    colors: ["rose", "ivory"],
    sizes: RTW,
    tags: ["ready-to-wear", "festive", "wedding"],
    collections: ["wedding-season"],
    blurb:
      "Raw silk in a muted rose, cut as a long shirt and straight trouser. The slub in the weave is the only ornament.",
  },
  {
    id: "kc-w-024",
    name: "Aiza Navy Velvet Formal",
    category: "women",
    subcategory: "women-formals",
    price: 32500,
    fabric: "Velvet",
    pieces: 2,
    colors: ["navy", "gold"],
    sizes: RTW,
    tags: ["ready-to-wear", "festive", "wedding", "winter"],
    collections: ["wedding-season"],
    isNew: true,
    blurb:
      "Navy velvet with gold zari along the front opening. Heavy, warm, and built for a December wedding.",
  },
  {
    id: "kc-w-025",
    name: "Kinza Gold Tissue Formal",
    category: "women",
    subcategory: "women-formals",
    price: 26400,
    sale: 19800,
    fabric: "Organza",
    pieces: 3,
    colors: ["gold", "ivory"],
    sizes: RTW,
    tags: ["ready-to-wear", "festive", "wedding"],
    collections: ["wedding-season"],
    blurb:
      "Gold tissue organza over an ivory slip, with a hand-finished scalloped hem. Catches light without shouting.",
  },
  {
    id: "kc-w-026",
    name: "Nimra Maroon Chiffon 3 Piece",
    category: "women",
    subcategory: "women-formals",
    price: 22900,
    fabric: "Chiffon",
    pieces: 3,
    colors: ["maroon", "gold"],
    sizes: RTW,
    tags: ["ready-to-wear", "festive", "wedding", "embroidered"],
    collections: ["wedding-season"],
    blurb:
      "Maroon chiffon with a gold-worked neckline and border. Three pieces, lined, ready to wear as it arrives.",
  },
  {
    id: "kc-w-027",
    name: "Rabia Ivory Organza 2 Piece",
    category: "women",
    subcategory: "women-formals",
    price: 17600,
    fabric: "Organza",
    pieces: 2,
    colors: ["ivory"],
    sizes: RTW,
    tags: ["ready-to-wear", "festive"],
    collections: ["wedding-season"],
    blurb:
      "The plainest formal we make: ivory organza, a single line of pearl work at the cuff, nothing else.",
  },
  {
    id: "kc-w-028",
    name: "Dua Teal Silk Formal",
    category: "women",
    subcategory: "women-formals",
    price: 21400,
    fabric: "Silk",
    pieces: 2,
    colors: ["teal", "gold"],
    sizes: RTW,
    tags: ["ready-to-wear", "festive", "wedding"],
    collections: ["wedding-season"],
    best: true,
    blurb:
      "Deep teal silk with a gold placket and covered buttons. Long enough to skim the ankle over a fitted trouser.",
  },
  {
    id: "kc-w-029",
    name: "Alina Charcoal Velvet 3 Piece",
    category: "women",
    subcategory: "women-formals",
    price: 33800,
    fabric: "Velvet",
    pieces: 3,
    colors: ["charcoal", "gold"],
    sizes: RTW,
    tags: ["ready-to-wear", "festive", "wedding", "winter", "embroidered"],
    collections: ["wedding-season"],
    featured: true,
    blurb:
      "Charcoal velvet, gold thread worked in a single band at the hem, paired with an organza dupatta so the weight stays balanced.",
  },

  /* --- Women / Bridal (made to order) --------------------------------- */
  {
    id: "kc-w-030",
    name: "Gulbahar Maroon Bridal Lehenga",
    category: "women",
    subcategory: "women-bridal",
    price: 245000,
    fabric: "Velvet",
    pieces: 3,
    colors: ["maroon", "gold"],
    sizes: RTW,
    tags: ["bridal", "wedding", "embroidered"],
    collections: ["wedding-season"],
    featured: true,
    madeToOrder: true,
    blurb:
      "A full maroon velvet lehenga with dense zardozi across the skirt and blouse, made to order over eight to ten weeks.",
  },
  {
    id: "kc-w-031",
    name: "Roshni Ivory Walima Gown",
    category: "women",
    subcategory: "women-bridal",
    price: 148000,
    fabric: "Organza",
    pieces: 2,
    colors: ["ivory", "gold"],
    sizes: RTW,
    tags: ["bridal", "wedding", "embroidered"],
    collections: ["wedding-season"],
    madeToOrder: true,
    blurb:
      "Ivory organza worked in pearl and silver over a fitted slip, with a trailing dupatta. Cut to your measurements.",
  },
  {
    id: "kc-w-032",
    name: "Sitara Gold Nikkah Ensemble",
    category: "women",
    subcategory: "women-bridal",
    price: 96000,
    sale: 79000,
    fabric: "Silk",
    pieces: 3,
    colors: ["gold", "ivory"],
    sizes: RTW,
    tags: ["bridal", "wedding", "embroidered"],
    collections: ["wedding-season"],
    best: true,
    madeToOrder: true,
    blurb:
      "A lighter bridal option in gold raw silk: long shirt, sharara and worked dupatta, suited to a daytime nikkah.",
  },
  {
    id: "kc-w-033",
    name: "Chandni Rose Mehndi Set",
    category: "women",
    subcategory: "women-bridal",
    price: 62000,
    fabric: "Organza",
    pieces: 3,
    colors: ["rose", "gold"],
    sizes: RTW,
    tags: ["bridal", "wedding", "embroidered"],
    collections: ["wedding-season"],
    isNew: true,
    madeToOrder: true,
    blurb:
      "Rose organza with mirror and thread work through the bodice, made for mehndi rather than the main day.",
  },
  {
    id: "kc-w-034",
    name: "Shehnai Emerald Bridal Sharara",
    category: "women",
    subcategory: "women-bridal",
    price: 178000,
    fabric: "Velvet",
    pieces: 3,
    colors: ["emerald", "gold"],
    sizes: RTW,
    tags: ["bridal", "wedding", "embroidered"],
    collections: ["wedding-season"],
    madeToOrder: true,
    blurb:
      "Emerald velvet sharara with a gold-worked kameez and net dupatta, hand-embroidered in our Lahore studio.",
  },

  /* --- Women / Shawls & Wraps ----------------------------------------- */
  {
    id: "kc-w-035",
    name: "Barfi Ivory Silk Shawl",
    category: "women",
    subcategory: "women-shawls",
    price: 9800,
    sale: 7350,
    fabric: "Silk",
    colors: ["ivory", "sand"],
    sizes: ONE_SIZE,
    tags: ["winter", "festive"],
    blurb:
      "A wide ivory silk shawl with a hand-rolled edge. Light to carry, warm enough for an evening outdoors.",
  },
  {
    id: "kc-w-036",
    name: "Sardi Charcoal Khaddar Wrap",
    category: "women",
    subcategory: "women-shawls",
    price: 5400,
    fabric: "Khaddar",
    colors: ["charcoal", "grey"],
    sizes: ONE_SIZE,
    tags: ["winter", "everyday"],
    isNew: true,
    blurb:
      "Thick charcoal khaddar with a fringed edge. The plain daily wrap, sized to cross over the shoulder.",
  },
  {
    id: "kc-w-037",
    name: "Kohsar Emerald Velvet Shawl",
    category: "women",
    subcategory: "women-shawls",
    price: 15200,
    fabric: "Velvet",
    colors: ["emerald", "maroon"],
    sizes: ONE_SIZE,
    tags: ["winter", "festive", "wedding"],
    collections: ["wedding-season"],
    blurb:
      "Emerald velvet with a narrow gold border, lined in soft cotton so it sits flat across the shoulders.",
  },
  {
    id: "kc-w-038",
    name: "Zaib Gold Jacquard Stole",
    category: "women",
    subcategory: "women-shawls",
    price: 6900,
    sale: 5200,
    fabric: "Jacquard",
    colors: ["gold", "beige"],
    sizes: ONE_SIZE,
    tags: ["festive", "winter"],
    blurb:
      "A narrow woven stole in muted gold. Enough to finish a plain kurta without taking it over.",
  },

  /* --- Men / Kurtas ---------------------------------------------------- */
  {
    id: "kc-m-001",
    name: "Wali Charcoal Cotton Kurta",
    category: "men",
    subcategory: "men-kurtas",
    price: 5400,
    fabric: "Cotton",
    pieces: 1,
    colors: ["charcoal", "black"],
    sizes: MENS,
    tags: ["ready-to-wear", "everyday"],
    collections: ["everyday-essentials"],
    best: true,
    blurb:
      "Charcoal cotton, straight cut, plain band collar. The kurta we sell most of, for reasons that are obvious in person.",
  },
  {
    id: "kc-m-002",
    name: "Aziz Beige Linen Kurta",
    category: "men",
    subcategory: "men-kurtas",
    price: 6100,
    fabric: "Linen",
    pieces: 1,
    colors: ["beige", "sand"],
    sizes: MENS,
    tags: ["ready-to-wear", "everyday"],
    collections: ["everyday-essentials", "the-new-season"],
    isNew: true,
    blurb:
      "Beige linen with a half placket and side vents. Loose through the body, cut to fall just past the hip.",
  },
  {
    id: "kc-m-003",
    name: "Hamza Ivory Cotton Kurta",
    category: "men",
    subcategory: "men-kurtas",
    price: 4600,
    sale: 3450,
    fabric: "Cotton",
    pieces: 1,
    colors: ["ivory"],
    sizes: MENS,
    tags: ["ready-to-wear", "everyday", "festive"],
    collections: ["everyday-essentials"],
    blurb:
      "Plain ivory cotton with a self-covered button placket. The default for Friday, Eid, and everything between.",
  },
  {
    id: "kc-m-004",
    name: "Bilal Navy Khaddar Kurta",
    category: "men",
    subcategory: "men-kurtas",
    price: 5900,
    fabric: "Khaddar",
    pieces: 1,
    colors: ["navy", "charcoal"],
    sizes: MENS,
    tags: ["ready-to-wear", "winter", "everyday"],
    blurb:
      "Navy khaddar woven a touch heavier for winter, with a stand collar and reinforced cuffs.",
  },
  {
    id: "kc-m-005",
    name: "Faris Grey Linen Kurta",
    category: "men",
    subcategory: "men-kurtas",
    price: 6800,
    sale: 5100,
    fabric: "Linen",
    pieces: 1,
    colors: ["grey", "sand"],
    sizes: MENS,
    tags: ["ready-to-wear", "everyday"],
    collections: ["everyday-essentials", "the-new-season"],
    featured: true,
    blurb:
      "Stone grey linen, unlined, with a deep side slit. Made to be worn creased and untucked.",
  },
  {
    id: "kc-m-006",
    name: "Talha Black Cotton Kurta",
    category: "men",
    subcategory: "men-kurtas",
    price: 5200,
    fabric: "Cotton",
    pieces: 1,
    colors: ["black"],
    sizes: MENS,
    tags: ["ready-to-wear", "everyday", "festive"],
    collections: ["everyday-essentials"],
    blurb:
      "Black cotton with a concealed placket and no visible stitching at the front. Plain to the point of being severe.",
  },

  /* --- Men / Shalwar Suits --------------------------------------------- */
  {
    id: "kc-m-007",
    name: "Daniyal Off-White Wash & Wear Suit",
    category: "men",
    subcategory: "men-shalwar-suits",
    price: 8200,
    sale: 6150,
    fabric: "Wash & Wear",
    pieces: 2,
    colors: ["ivory"],
    sizes: MENS,
    tags: ["ready-to-wear", "everyday", "festive"],
    collections: ["everyday-essentials"],
    best: true,
    blurb:
      "Off-white wash and wear, stitched as a full kurta and shalwar. Holds a press through a long day.",
  },
  {
    id: "kc-m-008",
    name: "Usman Charcoal Wash & Wear Suit",
    category: "men",
    subcategory: "men-shalwar-suits",
    price: 8900,
    fabric: "Wash & Wear",
    pieces: 2,
    colors: ["charcoal"],
    sizes: MENS,
    tags: ["ready-to-wear", "everyday"],
    collections: ["everyday-essentials"],
    blurb:
      "Charcoal two-piece with a mandarin collar and single chest pocket. Office-appropriate without being formal.",
  },
  {
    id: "kc-m-009",
    name: "Saad Navy Cotton Suit",
    category: "men",
    subcategory: "men-shalwar-suits",
    price: 11400,
    fabric: "Cotton",
    pieces: 2,
    colors: ["navy"],
    sizes: MENS,
    tags: ["ready-to-wear", "everyday", "festive"],
    collections: ["the-new-season"],
    isNew: true,
    blurb:
      "Heavier navy cotton, fully stitched as a suit, with a slightly narrowed shalwar through the leg.",
  },
  {
    id: "kc-m-010",
    name: "Zohaib Sand Khaddar Suit",
    category: "men",
    subcategory: "men-shalwar-suits",
    price: 9600,
    fabric: "Khaddar",
    pieces: 2,
    colors: ["sand", "beige"],
    sizes: MENS,
    tags: ["ready-to-wear", "winter", "everyday"],
    blurb: "Sand khaddar cut as a winter suit, with a lined collar and cuffs to hold their shape.",
  },

  /* --- Men / Waistcoats ------------------------------------------------ */
  {
    id: "kc-m-011",
    name: "Sultan Black Jacquard Waistcoat",
    category: "men",
    subcategory: "men-waistcoats",
    price: 11200,
    sale: 8400,
    fabric: "Jacquard",
    colors: ["black", "charcoal"],
    sizes: MENS,
    tags: ["festive", "wedding"],
    collections: ["wedding-season"],
    featured: true,
    blurb:
      "Black jacquard woven with a fine tonal damask, fully lined, cut to sit close over a plain kurta.",
  },
  {
    id: "kc-m-012",
    name: "Nawab Maroon Velvet Waistcoat",
    category: "men",
    subcategory: "men-waistcoats",
    price: 14800,
    fabric: "Velvet",
    colors: ["maroon", "navy"],
    sizes: MENS,
    tags: ["festive", "wedding", "winter"],
    collections: ["wedding-season"],
    blurb:
      "Maroon velvet with covered buttons and a shawl lapel. Weighted for December, restrained enough for a nikkah.",
  },
  {
    id: "kc-m-013",
    name: "Shahzad Gold Jacquard Waistcoat",
    category: "men",
    subcategory: "men-waistcoats",
    price: 13600,
    fabric: "Jacquard",
    colors: ["gold", "ivory"],
    sizes: MENS,
    tags: ["festive", "wedding"],
    collections: ["wedding-season"],
    isNew: true,
    blurb:
      "Muted gold jacquard, lined in ivory cotton. Reads as texture from across a room rather than as shine.",
  },

  /* --- Men / Unstitched fabric ----------------------------------------- */
  {
    id: "kc-m-014",
    name: "Rehan Grey Wash & Wear Fabric",
    category: "men",
    subcategory: "men-unstitched",
    price: 4300,
    fabric: "Wash & Wear",
    colors: ["grey"],
    sizes: UNSTITCHED,
    tags: ["unstitched", "everyday"],
    blurb:
      "Grey wash and wear suiting by the length, enough for a full kurta and shalwar for your own tailor.",
  },
  {
    id: "kc-m-015",
    name: "Junaid Navy Cotton Fabric",
    category: "men",
    subcategory: "men-unstitched",
    price: 5100,
    fabric: "Cotton",
    colors: ["navy"],
    sizes: UNSTITCHED,
    tags: ["unstitched", "everyday"],
    blurb:
      "Navy cotton suiting, mercerised for a flat finish. Cut generously so there is room to size up.",
  },
  {
    id: "kc-m-016",
    name: "Adeel Beige Khaddar Fabric",
    category: "men",
    subcategory: "men-unstitched",
    price: 3900,
    fabric: "Khaddar",
    colors: ["beige", "sand"],
    sizes: UNSTITCHED,
    tags: ["unstitched", "winter"],
    isNew: true,
    blurb:
      "Beige khaddar yardage with a visible hand-woven texture. Warm cloth at a working price.",
  },

  /* --- Accessories / Dupattas & Stoles --------------------------------- */
  {
    id: "kc-a-001",
    name: "Sana Gold Tissue Dupatta",
    category: "accessories",
    subcategory: "accessories-dupattas",
    price: 3900,
    sale: 2900,
    fabric: "Organza",
    colors: ["gold"],
    sizes: ONE_SIZE,
    tags: ["festive", "wedding"],
    blurb:
      "Gold tissue with a hand-finished edge, sized long enough to drape twice. The quickest way to lift a plain suit.",
  },
  {
    id: "kc-a-002",
    name: "Mahi Ivory Organza Dupatta",
    category: "accessories",
    subcategory: "accessories-dupattas",
    price: 3200,
    fabric: "Organza",
    colors: ["ivory"],
    sizes: ONE_SIZE,
    tags: ["festive", "everyday"],
    isNew: true,
    blurb:
      "Plain ivory organza, unembellished, with a rolled hem. Goes with more than you would expect.",
  },
  {
    id: "kc-a-003",
    name: "Noorjahan Emerald Silk Stole",
    category: "accessories",
    subcategory: "accessories-dupattas",
    price: 5800,
    fabric: "Silk",
    colors: ["emerald", "teal"],
    sizes: ONE_SIZE,
    tags: ["festive", "wedding"],
    collections: ["wedding-season"],
    blurb:
      "A narrow emerald silk stole with a fine gold selvedge. Enough colour to carry an otherwise plain outfit.",
  },
  {
    id: "kc-a-004",
    name: "Parisa Rose Chiffon Dupatta",
    category: "accessories",
    subcategory: "accessories-dupattas",
    price: 2600,
    fabric: "Chiffon",
    colors: ["rose"],
    sizes: ONE_SIZE,
    tags: ["everyday", "festive"],
    blurb:
      "Soft rose chiffon cut wide and hemmed by hand. The everyday dupatta, priced to own in several colours.",
  },

  /* --- Accessories / Khussa & Footwear --------------------------------- */
  {
    id: "kc-a-005",
    name: "Heer Beige Handmade Khussa",
    category: "accessories",
    subcategory: "accessories-footwear",
    price: 4800,
    sale: 3600,
    fabric: "Cotton",
    colors: ["beige", "gold"],
    sizes: KHUSSA,
    tags: ["festive", "everyday"],
    best: true,
    blurb:
      "Hand-stitched beige khussa with a small gold thread motif at the toe. Softens considerably after a week.",
  },
  {
    id: "kc-a-006",
    name: "Sohni Black Embroidered Khussa",
    category: "accessories",
    subcategory: "accessories-footwear",
    price: 5400,
    fabric: "Velvet",
    colors: ["black", "maroon"],
    sizes: KHUSSA,
    tags: ["festive", "wedding"],
    collections: ["wedding-season"],
    blurb:
      "Black velvet khussa worked with tonal thread across the vamp. Made by hand, so no two pairs match exactly.",
  },
];

/* ------------------------------------------------------------------ */
/* Builder — everything below is derived, never hand-maintained        */
/* ------------------------------------------------------------------ */

const COLOR_BY_VALUE = new Map<string, (typeof COLOR_TOKENS)[number]>(
  COLOR_TOKENS.map((c) => [c.value, c]),
);

/** Deterministic 32-bit hash. No Math.random anywhere — SSR must match client. */
function hash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Section 13 — `"{product name} — {colour} — front view"`, never "product image". */
const VIEWS = ["front view", "detail", "back view", "styled view"];

function buildImages(seed: Seed, heroColorName: string): ProductImage[] {
  const count = 2 + (hash(`${seed.id}:images`) % 3); // 2–4 images
  const first = hash(seed.id) % 12;
  return Array.from({ length: count }, (_, i) => {
    const index = ((first + i * 5) % 12) + 1;
    return {
      url: `/placeholders/product-${String(index).padStart(2, "0")}-3x4.svg`,
      alt: `${seed.name} — ${heroColorName} — ${VIEWS[i % VIEWS.length]}`,
      width: 900,
      height: 1200,
      ...(i === 0 ? { isPrimary: true } : {}),
    };
  });
}

function buildVariants(seed: Seed): ProductVariant[] {
  const variants: ProductVariant[] = [];
  for (const colorValue of seed.colors) {
    const token = COLOR_BY_VALUE.get(colorValue);
    if (!token) throw new Error(`${seed.id}: unknown colour "${colorValue}"`);
    for (const size of seed.sizes) {
      const key = `${seed.id}:${colorValue}:${size}`;
      const roll = hash(key) % 20;
      variants.push({
        id: slugify(key),
        sku: `${seed.id}-${colorValue.slice(0, 3)}-${slugify(size)}`.toUpperCase(),
        size,
        colorName: token.label,
        colorHex: token.hex,
        // Roughly one combination in seven is out of stock, so the PDP's
        // struck-through size state is exercised by real data.
        stock: roll < 3 ? 0 : 2 + roll,
      });
    }
  }
  return variants;
}

const CARE_BY_FABRIC: Record<string, string> = {
  Lawn: "Machine wash cold on a gentle cycle. Dry in shade. Warm iron.",
  Cotton: "Machine wash cold. Dry in shade to hold the colour. Warm iron.",
  Khaddar: "Hand wash cold for the first two washes. Dry flat. Warm iron.",
  Chiffon: "Dry clean only. Do not wring. Cool iron on reverse.",
  Organza: "Dry clean only. Store flat. Never iron over embellishment.",
  Silk: "Dry clean recommended. Cool iron on reverse, under a cloth.",
  Velvet: "Dry clean only. Steam to lift the pile. Never press flat.",
  Linen: "Machine wash cold. Creasing is characteristic of the cloth.",
  Jacquard: "Dry clean recommended. Cool iron on reverse only.",
  "Wash & Wear": "Machine wash warm. Drip dry. Little or no ironing needed.",
};

/** Fixed base date so `newest` sorting is stable across server and client. */
const CATALOGUE_DATE = Date.UTC(2026, 7, 20); // 20 August 2026
const DAY = 86_400_000;

function buildProduct(seed: Seed, index: number): Product {
  const heroToken = COLOR_BY_VALUE.get(seed.colors[0] ?? "");
  if (!heroToken) throw new Error(`${seed.id}: missing hero colour`);

  const h = hash(seed.id);
  const setPiece = seed.pieces ? ` as a ${seed.pieces}-piece set` : "";
  const description = [
    seed.blurb,
    `Cut from ${seed.fabric.toLowerCase()}${setPiece} and finished by hand in our Lahore studio.`,
    "Model is 5'7\" and wears a size M. Colour may read slightly differently between screens.",
  ].join("\n\n");

  return {
    id: seed.id,
    slug: slugify(seed.name),
    name: seed.name,
    description,
    shortDescription: seed.blurb,
    price: seed.price,
    ...(seed.sale ? { salePrice: seed.sale } : {}),
    categorySlug: seed.category,
    subcategorySlug: seed.subcategory,
    collectionSlugs: seed.collections ?? [],
    images: buildImages(seed, heroToken.label),
    variants: buildVariants(seed),
    fabric: seed.fabric,
    ...(seed.pieces ? { pieces: seed.pieces } : {}),
    care: CARE_BY_FABRIC[seed.fabric] ?? "Dry clean recommended.",
    tags: seed.tags,
    // 4.0–4.9, deterministic.
    rating: Math.round((4 + (h % 10) / 10) * 10) / 10,
    reviewCount: 6 + (h % 180),
    isFeatured: seed.featured === true,
    isNewArrival: seed.isNew === true,
    isBestSeller: seed.best === true,
    isOnSale: seed.sale != null,
    // Newest first in seed order, one product every three days.
    createdAt: new Date(CATALOGUE_DATE - index * 3 * DAY).toISOString(),
    ...(seed.madeToOrder ? { isMadeToOrder: true } : {}),
  };
}

export const products: Product[] = seeds.map(buildProduct);
