/**
 * PLP filter and sort vocabulary. See docs/BUILD-SPEC.pdf Sections 11.2 and 16.
 *
 * These are the *available* options and their labels. The live counts beside
 * each one come from the repository facets, never from this file.
 *
 * Filter state lives in the URL search params — never in component state.
 */

import type { ProductSort } from "@/types";

/** Section 16 — ready-to-wear runs XS–XXL; unstitched is a single variant. */
export const sizes = ["XS", "S", "M", "L", "XL", "XXL"] as const;
/**
 * Bed sizes are a size run like any other, and they arrive on the same
 * `variants[].size` field, so the PLP's size filter picks them up without
 * knowing anything about bedding. Listed separately only because a shopper
 * looking for a kurta should never be offered "King".
 */
export const bedSizes = ["Single", "Double", "Queen", "King"] as const;
export const UNSTITCHED_SIZE = "Unstitched" as const;

/**
 * Section 16 — fabric is a first-class filter because it is how Pakistani
 * customers actually shop.
 */
export const fabrics = [
  { value: "lawn", label: "Lawn" },
  { value: "cotton", label: "Cotton" },
  { value: "khaddar", label: "Khaddar" },
  { value: "chiffon", label: "Chiffon" },
  { value: "organza", label: "Organza" },
  { value: "silk", label: "Silk" },
  { value: "velvet", label: "Velvet" },
  { value: "linen", label: "Linen" },
  { value: "jacquard", label: "Jacquard" },
  { value: "wash-and-wear", label: "Wash & Wear" },
  // Bedding weaves. A sheet is bought by its weave the way a suit is
  // bought by its cloth, so they belong in the same vocabulary rather
  // than a parallel one that only /bedsheets knows about.
  { value: "percale", label: "Percale" },
  { value: "sateen", label: "Sateen" },
  { value: "flannel", label: "Flannel" },
] as const;

/**
 * The largest piece count a product may declare.
 *
 * TWELVE, RAISED FROM FIVE ON 2026-09-08 because bedding broke the assumption.
 * Section 16 wrote this rule for suits, where 1/2/3-piece covers the shop and
 * five is generous. A comforter set is sold as six, eight or twelve pieces, so
 * the Bedsheets department could not describe its own stock — the admin form
 * refused the number and the API refused it again.
 *
 * ONE CONSTANT, because the limit was written twice: `max={5}` on the form
 * input and `pieces > 5` in the API. Two copies of a rule is how a form starts
 * accepting something the server then rejects, and the message a shopkeeper
 * sees for that is a sentence about a field they filled in correctly.
 *
 * It replaces a `pieceCounts` list of 1/2/3 that NOTHING IMPORTED. The piece
 * facet is tallied from the products that actually exist
 * (`buildFacets` in catalogue-query.ts), so a hardcoded list of options was
 * never consulted — and had it been, it would have hidden every 5-piece suit
 * already in the catalogue.
 */
export const MAX_PIECES = 12;

/**
 * Section 15 — colour alone must never be the only way to distinguish a
 * variant, so every swatch carries a visible name alongside its hex.
 */
export const colors = [
  { value: "ivory", label: "Ivory", hex: "#F3EFE7" },
  { value: "sand", label: "Sand", hex: "#E3D9C6" },
  { value: "beige", label: "Beige", hex: "#D8C9B2" },
  { value: "gold", label: "Gold", hex: "#B08D3F" },
  { value: "rose", label: "Rose", hex: "#C48C8C" },
  { value: "maroon", label: "Maroon", hex: "#6E2637" },
  { value: "emerald", label: "Emerald", hex: "#1F5B45" },
  { value: "teal", label: "Teal", hex: "#256C74" },
  { value: "navy", label: "Navy", hex: "#1E2A44" },
  { value: "charcoal", label: "Charcoal", hex: "#3A3633" },
  { value: "black", label: "Black", hex: "#14110F" },
  { value: "grey", label: "Grey", hex: "#8A837C" },
] as const;

/** Section 11.2 — discount band filter. Values are minimum discount percent. */
export const discountBands = [
  { value: 10, label: "10% and above" },
  { value: 20, label: "20% and above" },
  { value: 30, label: "30% and above" },
  { value: 50, label: "50% and above" },
] as const;

/** Section 8.2 — the five sort options in the dropdown, in display order. */
export const sortOptions: readonly { value: ProductSort; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "best-selling", label: "Best Selling" },
];

export const DEFAULT_SORT: ProductSort = "featured";

/** Section 11.2 — numbered pagination, not infinite scroll. */
export const PER_PAGE = 24;

/** Section 11.6 — popular searches shown in the empty search modal. */
export const popularSearches = [
  "Unstitched lawn",
  "3 piece",
  "Bridal",
  "Men's kurta",
  "Chiffon formals",
  "Under PKR 5,000",
] as const;
