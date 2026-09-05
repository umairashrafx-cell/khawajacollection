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

  /**
   * Addendum to Section 8.1. Section 16 and Phase 5 both require a
   * made-to-order flag — bridal pieces swap Add to Cart for "Enquire on
   * WhatsApp" — but the interface above never declares one.
   */
  isMadeToOrder?: boolean;

  /**
   * Whether the piece is on the shop.
   *
   * OPTIONAL, AND ABSENT MEANS TRUE. Every storefront read goes through RLS,
   * which filters on `is_active`, so a Product reaching a customer-facing
   * page is active by definition and the field would be noise there. It is
   * populated only by the admin read paths, which deliberately bypass that
   * filter so an unpublished product can still be found and put back.
   */
  isActive?: boolean;
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
  /** One line, shown under the heading on the collection page. */
  tagline?: string;
  /**
   * The meta description, 150–160 characters (Section 13).
   *
   * SEPARATE FROM `tagline` BECAUSE THEY HAVE DIFFERENT JOBS. A tagline earns
   * its place by being short; a meta description earns its place by filling
   * the width of a search result. Using the tagline for both produced 50
   * characters of meta on four live pages — a third of the space Google was
   * offering, and the rest given back.
   */
  metaDescription?: string;
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
export type PaymentMethodId =
  | "cod"
  | "card"
  | "bank_transfer"
  /** Pakistan's two mobile wallets. Both are hosted redirects — see src/lib/payments/. */
  | "jazzcash"
  | "easypaisa";

/** Section 11.6 — the six-step tracking timeline, plus `cancelled`. */
export type OrderStatus =
  | "placed"
  | "confirmed"
  | "processing"
  | "shipped"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

/* ------------------------------------------------------------------ */
/* Orders — Section 8.3 (the `orders` and `order_items` tables)        */
/* ------------------------------------------------------------------ */

export interface OrderItem {
  productId: string;
  variantId: string;
  /** Snapshot: what the product was called when the order was placed. */
  nameSnapshot: string;
  slug: string;
  size: string;
  colorName: string;
  /** Integer PKR, recomputed server-side at order time. */
  unitPrice: number;
  quantity: number;
}

export interface ShippingAddress {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  province: Province;
  /** Optional — Section 16: many Pakistani customers do not know theirs. */
  postalCode?: string;
  notes?: string;
}

export interface OrderTotals {
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
}

export interface Order {
  id: string;
  /** Section 16 — human-readable and phone-friendly: KC-2026-00042. */
  orderNumber: string;
  email?: string;
  /** Normalised to +92 before storing (Section 16). */
  phone: string;
  shipping: ShippingAddress;
  items: OrderItem[];
  totals: OrderTotals;
  paymentMethod: PaymentMethodId;
  paymentStatus: "pending" | "paid" | "failed";
  status: OrderStatus;
  createdAt: string;
}

/** What the client sends. Prices are deliberately absent — see the orders route. */
export interface OrderDraft {
  email?: string;
  phone: string;
  shipping: ShippingAddress;
  items: { productId: string; variantId: string; quantity: number }[];
  paymentMethod: PaymentMethodId;
}
