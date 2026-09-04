/**
 * The seam that makes swapping the data source trivial.
 * See docs/BUILD-SPEC.pdf Section 8.2.
 *
 * Phases 1–7: MockProductRepository reads from src/data/products.ts.
 * Phase 8:    SupabaseProductRepository implements this same interface.
 *
 * Components never import either implementation directly — they import from
 * src/lib/repositories/index.ts, which picks one based on an env flag.
 */

import type { Category, Collection, Facets, Product, ProductSort } from "@/types";

export interface ProductQuery {
  category?: string;
  subcategory?: string;
  collection?: string;
  sizes?: string[];
  colors?: string[];
  fabrics?: string[];
  minPrice?: number;
  maxPrice?: number;
  onSale?: boolean;
  inStockOnly?: boolean;
  minDiscount?: number;
  sort?: ProductSort;
  page?: number;
  perPage?: number;
  q?: string;

  /* --- Addendum to Section 8.2 --- */

  /**
   * Cross-cutting PLPs (`/unstitched`, `/ready-to-wear`, `/bridal`) and the
   * mega menu's `?tag=festive` links need to reach Product.tags, which the
   * spec's query shape has no field for.
   */
  tags?: string[];
  /** Section 16 makes piece count a first-class filter. */
  pieces?: number[];
  /** Section 11.1 — the homepage rails read these flags. */
  isNewArrival?: boolean;
  isBestSeller?: boolean;
  isFeatured?: boolean;
}

export interface ProductListResult {
  items: Product[];
  total: number;
  facets: Facets;
}

export interface ProductRepository {
  list(query: ProductQuery): Promise<ProductListResult>;
  getBySlug(slug: string): Promise<Product | null>;
  /**
   * Addendum to Section 8.2. Checkout receives ids, not slugs, and pricing an
   * order by scanning every slug is absurd — Section 8.3 makes `id` the
   * products table's primary key, so this is a lookup Supabase gives for free.
   */
  getById(id: string): Promise<Product | null>;
  getAllSlugs(): Promise<string[]>;
  related(product: Product, limit: number): Promise<Product[]>;

  /**
   * ADMIN. Set one variant's stock and return the product it belongs to.
   *
   * The only write on this interface, and scoped as narrowly as it can be:
   * one variant, one integer. Prices are deliberately not editable here —
   * `/api/orders` recomputes every price from the repository at order time
   * (Guardrail 5), so a price is the one field where a careless edit changes
   * what customers are charged, and it is better done deliberately in the
   * database than with an inline input on a busy screen.
   *
   * Returns null when no such variant exists.
   */
  updateVariantStock(variantId: string, stock: number): Promise<Product | null>;

  /**
   * ADMIN. Creates a product when `id` is absent, replaces one when present.
   *
   * One method for both because the two differ by a single WHERE clause and
   * the form that calls them is identical. Splitting them would mean two code
   * paths that must stay in agreement about what a product is.
   *
   * Images and variants are replaced wholesale, not merged — the form always
   * submits the complete set, and a merge would leave no way to delete the
   * last image or retire a size.
   */
  saveProduct(input: ProductInput, id?: string): Promise<Product>;

  /**
   * Take `quantity` off a variant, atomically, and return what is left.
   * Returns null when the variant is gone or does not have enough.
   *
   * WHY THIS IS NOT "read the stock, then call updateVariantStock". Those are
   * two statements, and between them a second request reads the same number.
   * Both see the last piece, both pass the check, both orders are accepted,
   * and one customer is told later that theirs is cancelled. Reserving has to
   * be one operation that either succeeds or reports that it could not.
   *
   * A null is a refusal, never a zero. Callers must not treat it as "sold
   * out, but carry on".
   */
  reserveStock(variantId: string, quantity: number): Promise<number | null>;

  /**
   * Put stock back. Called when a later line in the same basket cannot be
   * reserved, or when writing the order fails after the reservation — without
   * it a failed checkout silently eats stock nobody bought.
   */
  releaseStock(variantId: string, quantity: number): Promise<void>;
}

/** What the admin form submits. Prices are integer PKR (Section 16). */
export interface ProductInput {
  slug: string;
  name: string;
  description: string;
  shortDescription: string;
  price: number;
  salePrice: number | null;
  categorySlug: string;
  subcategorySlug: string | null;
  fabric: string | null;
  pieces: number | null;
  care: string | null;
  tags: string[];
  isFeatured: boolean;
  isNewArrival: boolean;
  isMadeToOrder: boolean;
  isActive: boolean;
  images: { url: string; alt: string }[];
  variants: {
    /** Present when editing an existing variant, so its stock survives. */
    id?: string | undefined;
    sku: string;
    size: string;
    colorName: string;
    colorHex: string;
    stock: number;
  }[];
}

/**
 * Addendum: the spec defines Category and Collection types and a Supabase
 * schema for both, but no repository for them. The mega menu, PLP headers,
 * breadcrumbs and sitemap all need them, and Phase 8 has to swap them out
 * alongside products — so they get the same treatment.
 */
export interface CategoryNode extends Category {
  children: Category[];
}

export interface CategoryRepository {
  list(): Promise<Category[]>;
  /** Top-level categories with their children attached, in sortOrder. */
  tree(): Promise<CategoryNode[]>;
  getBySlug(slug: string): Promise<Category | null>;
  /**
   * Resolves `/women/unstitched` → the `women-unstitched` category.
   *
   * Category slugs are globally unique (Section 8.3 makes slug the primary
   * key), so a subcategory's slug is `${parentSlug}-${urlSegment}` and the URL
   * only carries the segment.
   */
  getSubcategory(parentSlug: string, segment: string): Promise<Category | null>;

  /**
   * Create a category, or rename an existing one.
   *
   * WHY THE SLUG IS PART OF THE INPUT AND NEVER CHANGES. `slug` is the primary
   * key (Section 8.3), it is the URL of the listing page, and every product
   * carries it in `category_slug`. Renaming it would 404 the page and orphan
   * every product on it in the same statement, so an edit reaches only the
   * name, description, image and order; a new slug always means a new
   * category.
   */
  saveCategory(input: CategoryInput): Promise<Category>;
}

export interface CategoryInput {
  slug: string;
  name: string;
  /** null for a top-level department. */
  parentSlug: string | null;
  description: string | null;
  /** A 4:5 card. null is fine — the listing page does not require one. */
  imageUrl: string | null;
  sortOrder: number;
}

export interface CollectionRepository {
  list(): Promise<Collection[]>;
  getBySlug(slug: string): Promise<Collection | null>;
}
