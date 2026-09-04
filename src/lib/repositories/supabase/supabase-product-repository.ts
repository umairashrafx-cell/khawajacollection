/**
 * SupabaseProductRepository. See docs/BUILD-SPEC.pdf Phase 8 item 3:
 * "Implement SupabaseProductRepository against the SAME interface. Do not
 * change a single component."
 *
 * It reads through the anonymous client, so every row it can see is a row RLS
 * allows the public to see — active products only, and their images and
 * variants gated behind that (supabase/migrations/0002_rls.sql).
 *
 * ON FACETING. Section 11.2 requires facet counts computed with each facet's
 * own filter excluded. That is one query per dimension in SQL, and doing it
 * with eight round trips to Postgres for every listing view would be slower
 * than it is worth at this catalogue size. Instead the filtered set is fetched
 * once and faceted in memory, exactly as the mock repository does — the same
 * code path, so the two implementations cannot disagree about what a count
 * means. At sixty products this is trivially fast; past a few thousand it
 * should become a Postgres function, and that is a change to this file alone.
 */

import { PER_PAGE } from "@/config/filters";
import { browserClient } from "@/lib/supabase/client";
import type { Product, ProductImage, ProductVariant } from "@/types";
import { buildFacets, filterAndSort } from "../shared/catalogue-query";
import type { ProductListResult, ProductQuery, ProductRepository } from "../product-repository";

/** The shape a joined product row comes back as. */
interface Row {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  short_description: string | null;
  price: number;
  sale_price: number | null;
  category_slug: string | null;
  subcategory_slug: string | null;
  fabric: string | null;
  pieces: number | null;
  care: string | null;
  tags: string[] | null;
  rating: number | null;
  review_count: number | null;
  is_featured: boolean | null;
  is_new_arrival: boolean | null;
  is_best_seller: boolean | null;
  is_made_to_order: boolean | null;
  created_at: string;
  product_images: {
    url: string;
    alt: string | null;
    sort_order: number | null;
    is_primary: boolean | null;
  }[];
  product_variants: {
    id: string;
    sku: string;
    size: string;
    color_name: string | null;
    color_hex: string | null;
    stock: number | null;
    price_override: number | null;
  }[];
  product_collections: { collection_slug: string }[];
}

const SELECT = `
  id, slug, name, description, short_description, price, sale_price,
  category_slug, subcategory_slug, fabric, pieces, care, tags, rating,
  review_count, is_featured, is_new_arrival, is_best_seller, is_made_to_order,
  created_at,
  product_images ( url, alt, sort_order, is_primary ),
  product_variants ( id, sku, size, color_name, color_hex, stock, price_override ),
  product_collections ( collection_slug )
`;

function toProduct(row: Row): Product {
  const images: ProductImage[] = [...row.product_images]
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((image) => ({
      url: image.url,
      alt: image.alt ?? row.name,
      // The table stores no dimensions; every image in this catalogue is a 3:4
      // frame and the Image component needs explicit numbers to reserve space.
      width: 900,
      height: 1200,
      ...(image.is_primary ? { isPrimary: true } : {}),
    }));

  const variants: ProductVariant[] = row.product_variants.map((variant) => ({
    id: variant.id,
    sku: variant.sku,
    size: variant.size,
    colorName: variant.color_name ?? "",
    colorHex: variant.color_hex ?? "#000000",
    stock: variant.stock ?? 0,
    ...(variant.price_override !== null ? { priceOverride: variant.price_override } : {}),
  }));

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description ?? "",
    shortDescription: row.short_description ?? "",
    price: row.price,
    ...(row.sale_price !== null ? { salePrice: row.sale_price } : {}),
    categorySlug: row.category_slug ?? "",
    ...(row.subcategory_slug ? { subcategorySlug: row.subcategory_slug } : {}),
    collectionSlugs: row.product_collections.map((link) => link.collection_slug),
    images,
    variants,
    ...(row.fabric ? { fabric: row.fabric } : {}),
    ...(row.pieces !== null ? { pieces: row.pieces } : {}),
    ...(row.care ? { care: row.care } : {}),
    tags: row.tags ?? [],
    rating: Number(row.rating ?? 0),
    reviewCount: row.review_count ?? 0,
    isFeatured: row.is_featured === true,
    isNewArrival: row.is_new_arrival === true,
    isBestSeller: row.is_best_seller === true,
    isOnSale: row.sale_price !== null,
    createdAt: row.created_at,
    ...(row.is_made_to_order ? { isMadeToOrder: true } : {}),
  };
}

/** Canonical UUID shape, as Postgres accepts it. */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Slug to display name for facet labels and search. Cached for the process:
 * the taxonomy changes when someone edits the catalogue, not per request.
 */
let names: Map<string, string> | null = null;

async function taxonomyNames(): Promise<Map<string, string>> {
  if (names) return names;
  const supabase = await browserClient();
  const [categories, collections] = await Promise.all([
    supabase.from("categories").select("slug, name"),
    supabase.from("collections").select("slug, name"),
  ]);
  names = new Map([
    ...((categories.data ?? []) as { slug: string; name: string }[]).map(
      (row) => [row.slug, row.name] as [string, string],
    ),
    ...((collections.data ?? []) as { slug: string; name: string }[]).map(
      (row) => [row.slug, row.name] as [string, string],
    ),
  ]);
  return names;
}

async function fetchAll(): Promise<Product[]> {
  const { data, error } = await (await browserClient()).from("products").select(SELECT);
  if (error) throw new Error(`Supabase products query failed: ${error.message}`);
  return ((data ?? []) as unknown as Row[]).map(toProduct);
}

export class SupabaseProductRepository implements ProductRepository {
  async list(query: ProductQuery): Promise<ProductListResult> {
    const all = await fetchAll();
    const names = await taxonomyNames();
    const sorted = filterAndSort(all, query, names);

    const perPage = query.perPage ?? PER_PAGE;
    const page = Math.max(1, query.page ?? 1);
    const start = (page - 1) * perPage;

    return {
      items: sorted.slice(start, start + perPage),
      total: sorted.length,
      facets: buildFacets(all, query, names),
    };
  }

  async getBySlug(slug: string): Promise<Product | null> {
    const { data, error } = await (
      await browserClient()
    )
      .from("products")
      .select(SELECT)
      .eq("slug", slug)
      .maybeSingle();

    if (error) throw new Error(`Supabase product query failed: ${error.message}`);
    return data ? toProduct(data as unknown as Row) : null;
  }

  async getById(id: string): Promise<Product | null> {
    // `products.id` is a uuid column, so Postgres raises 22P02 on anything
    // that is not one and PostgREST turns that into a 500. Every caller here
    // takes its id from somewhere a stranger can reach — /api/orders reads it
    // straight off the request body — so a malformed id has to mean "no such
    // product", which is the truth, rather than crashing the endpoint. The
    // mock repository already behaved this way; without this guard the two
    // implementations disagreed and only the Supabase one 500'd.
    if (!UUID.test(id)) return null;

    const { data, error } = await (
      await browserClient()
    )
      .from("products")
      .select(SELECT)
      .eq("id", id)
      .maybeSingle();

    if (error) throw new Error(`Supabase product query failed: ${error.message}`);
    return data ? toProduct(data as unknown as Row) : null;
  }

  async getAllSlugs(): Promise<string[]> {
    const { data, error } = await (await browserClient()).from("products").select("slug");
    if (error) throw new Error(`Supabase slug query failed: ${error.message}`);
    return ((data ?? []) as { slug: string }[]).map((row) => row.slug);
  }

  async related(product: Product, limit: number): Promise<Product[]> {
    const all = await fetchAll();
    const score = (candidate: Product) => {
      if (candidate.subcategorySlug === product.subcategorySlug) return 0;
      if (candidate.categorySlug === product.categorySlug) return 1;
      if (candidate.collectionSlugs.some((s) => product.collectionSlugs.includes(s))) return 2;
      return 3;
    };
    return all
      .filter((candidate) => candidate.id !== product.id)
      .sort((a, b) => score(a) - score(b) || b.reviewCount - a.reviewCount)
      .slice(0, limit);
  }
}
