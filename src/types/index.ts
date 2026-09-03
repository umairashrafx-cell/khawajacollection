/**
 * Khawaja Collection — single source of truth for domain types.
 * See docs/BUILD-SPEC.pdf Section 8.1.
 *
 * Nothing in here knows where data comes from. The mock repository (Phase 1)
 * and the Supabase repository (Phase 8) both produce exactly these shapes.
 */

export type Currency = "PKR";

export interface ProductImage {
  url: string;
  alt: string;
  width: number;
  height: number;
  isPrimary?: boolean;
}

export interface ProductVariant {
  id: string;
  sku: string;
  size: string; // "XS" | "S" ... or "Unstitched"
  colorName: string; // "Ivory"
  colorHex: string; // "#F3EFE7"
  stock: number; // 0 = out of stock
  priceOverride?: number;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string; // rich text / markdown
  shortDescription: string; // max 160 chars, also used for meta
  price: number; // integer PKR
  salePrice?: number; // integer PKR, must be < price
  categorySlug: string; // "women"
  subcategorySlug?: string; // "unstitched"
  collectionSlugs: string[];
  images: ProductImage[];
  variants: ProductVariant[];
  fabric?: string;
  pieces?: number; // 1, 2, 3 piece
  care?: string;
  tags: string[];
  rating: number; // 0–5
  reviewCount: number;
  isFeatured: boolean;
  isNewArrival: boolean;
  isBestSeller: boolean;
  isOnSale: boolean;
  createdAt: string; // ISO
}

export interface Category {
  slug: string;
  name: string;
  description?: string;
  image?: ProductImage;
  parentSlug?: string;
  sortOrder: number;
}

export interface Collection {
  slug: string;
  name: string;
  tagline?: string;
  heroImage?: ProductImage;
  isActive: boolean;
}

export interface CartLine {
  productId: string;
  variantId: string;
  slug: string;
  name: string;
  image: string;
  size: string;
  colorName: string;
  unitPrice: number; // resolved: salePrice ?? price
  quantity: number;
}

/* ------------------------------------------------------------------ */
/* Addendum — types the spec references but does not define verbatim.  */
/* ------------------------------------------------------------------ */

/**
 * A single facet value with its live result count. Section 11.2 requires
 * facet counts to be real, computed from the repository.
 */
export interface FacetValue {
  value: string;
  label: string;
  count: number;
}

/**
 * Facets returned alongside a product list (Section 8.2, `ProductRepository.list`).
 * Every array is already filtered to what the current query can still reach.
 */
export interface Facets {
  categories: FacetValue[];
  subcategories: FacetValue[];
  collections: FacetValue[];
  sizes: FacetValue[];
  colors: FacetValue[];
  fabrics: FacetValue[];
  pieces: FacetValue[];
  priceRange: { min: number; max: number };
}

/** Sort options exposed by the PLP sort dropdown (Section 8.2). */
export type ProductSort = "featured" | "newest" | "price-asc" | "price-desc" | "best-selling";

/** Section 16 — the seven Pakistani shipping regions. */
export type Province =
  | "Punjab"
  | "Sindh"
  | "Khyber Pakhtunkhwa"
  | "Balochistan"
  | "Gilgit-Baltistan"
  | "Azad Jammu & Kashmir"
  | "Islamabad Capital Territory";

/** Section 11.5 — only `cod` is live at launch. */
export type PaymentMethodId = "cod" | "card" | "bank_transfer";

/** Section 11.6 — the six-step tracking timeline, plus `cancelled`. */
export type OrderStatus =
  | "placed"
  | "confirmed"
  | "processing"
  | "shipped"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";
