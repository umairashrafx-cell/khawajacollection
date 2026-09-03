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
] as const;

/** Section 16 — 1/2/3-piece suits are a first-class filter. */
export const pieceCounts = [
  { value: 1, label: "1 Piece" },
  { value: 2, label: "2 Piece" },
  { value: 3, label: "3 Piece" },
] as const;

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
