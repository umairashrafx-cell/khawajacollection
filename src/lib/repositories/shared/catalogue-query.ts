/**
 * Filtering, sorting and faceting, shared by both repository implementations.
 *
 * Phase 8 says the Supabase repository must satisfy the same interface without
 * changing a component. That is not quite enough on its own: two
 * implementations that each hand-roll "what does a facet count mean" will
 * eventually disagree, and the bug shows up as a number that is subtly wrong
 * on one deployment. So the semantics live here once and both call it.
 *
 * Section 11.2 is the contract: a facet's own filter is excluded from its own
 * counts, so the number beside "L" is what picking L would actually give.
 */

import { colors as COLOR_TOKENS, fabrics as FABRIC_TOKENS } from "@/config/filters";
import { discountPercent } from "@/lib/format";
import type { FacetValue, Facets, Product } from "@/types";
import type { ProductQuery } from "../product-repository";

export type Sortable = Product;

/** The dimension being counted, which must not filter itself. */
type Dimension =
  "category" | "subcategory" | "collection" | "sizes" | "colors" | "fabrics" | "pieces" | "price";

const COLOR_LABEL = new Map<string, string>(COLOR_TOKENS.map((c) => [c.value, c.label]));
const FABRIC_LABEL = new Map<string, string>(FABRIC_TOKENS.map((f) => [f.value, f.label]));

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function effectivePrice(product: Product): number {
  return product.salePrice ?? product.price;
}

function discountOf(product: Product): number {
  return discountPercent(effectivePrice(product), product.price) ?? 0;
}

/** Section 11.6 — match on name, category, collection, tags and fabric. */
function searchIndex(product: Product, names: Map<string, string>): string {
  return [
    product.name,
    product.fabric ?? "",
    names.get(product.categorySlug) ?? product.categorySlug,
    names.get(product.subcategorySlug ?? "") ?? product.subcategorySlug ?? "",
    ...product.collectionSlugs.map((slug) => names.get(slug) ?? slug),
    ...product.tags,
    ...product.variants.map((variant) => variant.colorName),
  ]
    .join(" ")
    .toLowerCase();
}

export function matches(
  product: Product,
  query: ProductQuery,
  names: Map<string, string>,
  skip?: Dimension,
): boolean {
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

  if (query.tags?.length && !query.tags.some((tag) => product.tags.includes(tag))) return false;

  if (skip !== "pieces" && query.pieces?.length) {
    if (product.pieces == null || !query.pieces.includes(product.pieces)) return false;
  }

  if (skip !== "fabrics" && query.fabrics?.length) {
    if (!query.fabrics.includes(slugify(product.fabric ?? ""))) return false;
  }

  const wantsSizes = skip !== "sizes" && (query.sizes?.length ?? 0) > 0;
  const wantsColors = skip !== "colors" && (query.colors?.length ?? 0) > 0;
  if (wantsSizes || wantsColors || query.inStockOnly) {
    const ok = product.variants.some((variant) => {
      if (wantsSizes && !query.sizes?.includes(variant.size)) return false;
      if (wantsColors && !query.colors?.includes(slugify(variant.colorName))) return false;
      if (query.inStockOnly && variant.stock <= 0) return false;
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
    const haystack = searchIndex(product, names);
    // Every term must appear, so "lawn 3 piece" narrows rather than widens.
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

export function filterAndSort(
  products: Product[],
  query: ProductQuery,
  names: Map<string, string> = new Map(),
): Product[] {
  const rows = products.filter((product) => matches(product, query, names));
  const sorter = SORTERS[query.sort ?? "featured"] ?? SORTERS["featured"];
  return sorter ? [...rows].sort(sorter) : rows;
}

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

export function buildFacets(
  products: Product[],
  query: ProductQuery,
  names: Map<string, string> = new Map(),
): Facets {
  const forDimension = (dimension: Dimension) =>
    products.filter((product) => matches(product, query, names, dimension));

  const prices = forDimension("price").map(effectivePrice);
  const named = (slug: string) => names.get(slug) ?? slug;

  return {
    categories: tally(forDimension("category"), (p) => [p.categorySlug], named),
    subcategories: tally(
      forDimension("subcategory"),
      (p) => (p.subcategorySlug ? [p.subcategorySlug] : []),
      named,
    ),
    collections: tally(forDimension("collection"), (p) => p.collectionSlugs, named),
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
