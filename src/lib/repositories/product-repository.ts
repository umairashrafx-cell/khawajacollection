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
  getAllSlugs(): Promise<string[]>;
  related(product: Product, limit: number): Promise<Product[]>;
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
}

export interface CollectionRepository {
  list(): Promise<Collection[]>;
  getBySlug(slug: string): Promise<Collection | null>;
}
