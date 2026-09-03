/**
 * In-memory ProductRepository backed by src/data/products.ts.
 * See docs/BUILD-SPEC.pdf Section 8.2 and Phase 1 item 2.
 *
 * Phase 8 swaps this for SupabaseProductRepository behind the same interface.
 * Nothing here may leak into a component: import from
 * src/lib/repositories/index.ts instead.
 */

import { categories } from "@/data/categories";
import { collections } from "@/data/collections";
import { products } from "@/data/products";
import { PER_PAGE, colors as COLOR_TOKENS, fabrics as FABRIC_TOKENS } from "@/config/filters";
import { discountPercent } from "@/lib/format";
import type { FacetValue, Facets, Product } from "@/types";
import type { ProductListResult, ProductQuery, ProductRepository } from "../product-repository";

/** The dimension a facet is being counted for, and so must not filter itself. */
type Dimension =
  "category" | "subcategory" | "collection" | "sizes" | "colors" | "fabrics" | "pieces" | "price";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** The price a customer actually pays. */
function effectivePrice(product: Product): number {
  return product.salePrice ?? product.price;
}

function discountOf(product: Product): number {
  return discountPercent(effectivePrice(product), product.price) ?? 0;
}

const CATEGORY_NAME = new Map(categories.map((c) => [c.slug, c.name]));
const COLLECTION_NAME = new Map(collections.map((c) => [c.slug, c.name]));
const COLOR_LABEL = new Map<string, string>(COLOR_TOKENS.map((c) => [c.value, c.label]));
const FABRIC_LABEL = new Map<string, string>(FABRIC_TOKENS.map((f) => [f.value, f.label]));

/** Section 11.6 — match on name, category, collection, tags and fabric. */
function searchIndex(product: Product): string {
  return [
    product.name,
    product.fabric ?? "",
    CATEGORY_NAME.get(product.categorySlug) ?? "",
    CATEGORY_NAME.get(product.subcategorySlug ?? "") ?? "",
    ...product.collectionSlugs.map((s) => COLLECTION_NAME.get(s) ?? s),
    ...product.tags,
    ...product.variants.map((v) => v.colorName),
  ]
    .join(" ")
    .toLowerCase();
}

const SEARCH_INDEX = new Map(products.map((p) => [p.id, searchIndex(p)]));

/**
 * Does this product satisfy the query?
 *
 * `skip` omits one dimension so that dimension's own facet counts stay live —
 * a shopper who has already picked size M still needs to see how many results
 * size L would give.
 */
function matches(product: Product, query: ProductQuery, skip?: Dimension): boolean {
  if (skip !== "category" && query.category && product.categorySlug !== query.category) {
    return false;
  }
  if (
    skip !== "subcategory" &&
    query.subcategory &&
    product.subcategorySlug !== query.subcategory
  ) {
    return false;
  }
  if (
    skip !== "collection" &&
    query.collection &&
    !product.collectionSlugs.includes(query.collection)
  ) {
    return false;
  }

  if (query.tags?.length && !query.tags.some((t) => product.tags.includes(t))) return false;

  if (skip !== "pieces" && query.pieces?.length) {
    if (product.pieces == null || !query.pieces.includes(product.pieces)) return false;
  }

  if (skip !== "fabrics" && query.fabrics?.length) {
    const fabric = slugify(product.fabric ?? "");
    if (!query.fabrics.includes(fabric)) return false;
  }

  // A size or colour filter is satisfied by any one variant, and when
  // in-stock-only is on, by a variant that is actually available.
  const wantsSizes = skip !== "sizes" && (query.sizes?.length ?? 0) > 0;
  const wantsColors = skip !== "colors" && (query.colors?.length ?? 0) > 0;
  if (wantsSizes || wantsColors || query.inStockOnly) {
    const ok = product.variants.some((v) => {
      if (wantsSizes && !query.sizes?.includes(v.size)) return false;
      if (wantsColors && !query.colors?.includes(slugify(v.colorName))) return false;
      if (query.inStockOnly && v.stock <= 0) return false;
      return true;
    });
    if (!ok) return false;
  }

  if (skip !== "price") {
    const price = effectivePrice(product);
    if (query.minPrice != null && price < query.minPrice) return false;
    if (query.maxPrice != null && price > query.maxPrice) return false;
  }

  if (query.onSale && !product.isOnSale) return false;
  if (query.minDiscount != null && discountOf(product) < query.minDiscount) return false;
  if (query.isNewArrival && !product.isNewArrival) return false;
  if (query.isBestSeller && !product.isBestSeller) return false;
  if (query.isFeatured && !product.isFeatured) return false;

  const q = query.q?.trim().toLowerCase();
  if (q) {
    const haystack = SEARCH_INDEX.get(product.id) ?? "";
    // Every term must appear somewhere, so "lawn 3 piece" narrows rather than widens.
    if (!q.split(/\s+/).every((term) => haystack.includes(term))) return false;
  }

  return true;
}

const SORTERS: Record<string, (a: Product, b: Product) => number> = {
  featured: (a, b) =>
    Number(b.isFeatured) - Number(a.isFeatured) || b.createdAt.localeCompare(a.createdAt),
  newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
  "price-asc": (a, b) => effectivePrice(a) - effectivePrice(b),
  "price-desc": (a, b) => effectivePrice(b) - effectivePrice(a),
  "best-selling": (a, b) =>
    Number(b.isBestSeller) - Number(a.isBestSeller) || b.reviewCount - a.reviewCount,
};

function tally(
  rows: Product[],
  pick: (product: Product) => string[],
  label: (value: string) => string,
): FacetValue[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    // A product counts once per distinct value, not once per variant.
    for (const value of new Set(pick(row))) {
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([value, count]) => ({ value, label: label(value), count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

function buildFacets(query: ProductQuery): Facets {
  const forDimension = (dimension: Dimension) =>
    products.filter((p) => matches(p, query, dimension));

  const priceRows = forDimension("price");
  const prices = priceRows.map(effectivePrice);

  return {
    categories: tally(
      forDimension("category"),
      (p) => [p.categorySlug],
      (v) => CATEGORY_NAME.get(v) ?? v,
    ),
    subcategories: tally(
      forDimension("subcategory"),
      (p) => (p.subcategorySlug ? [p.subcategorySlug] : []),
      (v) => CATEGORY_NAME.get(v) ?? v,
    ),
    collections: tally(
      forDimension("collection"),
      (p) => p.collectionSlugs,
      (v) => COLLECTION_NAME.get(v) ?? v,
    ),
    sizes: tally(
      forDimension("sizes"),
      (p) => p.variants.map((v) => v.size),
      (v) => v,
    ),
    colors: tally(
      forDimension("colors"),
      (p) => p.variants.map((v) => slugify(v.colorName)),
      (v) => COLOR_LABEL.get(v) ?? v,
    ),
    fabrics: tally(
      forDimension("fabrics"),
      (p) => (p.fabric ? [slugify(p.fabric)] : []),
      (v) => FABRIC_LABEL.get(v) ?? v,
    ),
    pieces: tally(
      forDimension("pieces"),
      (p) => (p.pieces != null ? [String(p.pieces)] : []),
      (v) => `${v} Piece`,
    ),
    priceRange: {
      min: prices.length ? Math.min(...prices) : 0,
      max: prices.length ? Math.max(...prices) : 0,
    },
  };
}

export class MockProductRepository implements ProductRepository {
  async list(query: ProductQuery): Promise<ProductListResult> {
    const rows = products.filter((p) => matches(p, query));

    const sorter = SORTERS[query.sort ?? "featured"] ?? SORTERS["featured"];
    const sorted = sorter ? [...rows].sort(sorter) : rows;

    const perPage = query.perPage ?? PER_PAGE;
    const page = Math.max(1, query.page ?? 1);
    const start = (page - 1) * perPage;

    return {
      items: sorted.slice(start, start + perPage),
      total: sorted.length,
      facets: buildFacets(query),
    };
  }

  async getBySlug(slug: string): Promise<Product | null> {
    return products.find((p) => p.slug === slug) ?? null;
  }

  async getAllSlugs(): Promise<string[]> {
    return products.map((p) => p.slug);
  }

  /** Nearest first: same subcategory, then same category, then anything else. */
  async related(product: Product, limit: number): Promise<Product[]> {
    const score = (candidate: Product) => {
      if (candidate.subcategorySlug === product.subcategorySlug) return 0;
      if (candidate.categorySlug === product.categorySlug) return 1;
      if (candidate.collectionSlugs.some((s) => product.collectionSlugs.includes(s))) return 2;
      return 3;
    };
    return products
      .filter((p) => p.id !== product.id)
      .sort((a, b) => score(a) - score(b) || b.reviewCount - a.reviewCount)
      .slice(0, limit);
  }
}
