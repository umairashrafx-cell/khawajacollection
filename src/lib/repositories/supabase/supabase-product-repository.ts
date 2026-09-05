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
import { browserClient, serviceClient } from "@/lib/supabase/client";
import type { Product, ProductImage, ProductVariant } from "@/types";
import { buildFacets, filterAndSort } from "../shared/catalogue-query";
import type {
  ProductInput,
  ProductListResult,
  ProductQuery,
  ProductRepository,
} from "../product-repository";

/** The shape a joined product row comes back as. */
interface Row {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  short_description: string | null;
  price: number;
  sale_price: number | null;
  is_active: boolean | null;
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
  id, slug, name, description, short_description, price, sale_price, is_active,
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
    // Only the admin reads ever see `false` here — RLS keeps inactive rows
    // away from every other path, so this is `true` on the storefront always.
    isActive: row.is_active !== false,
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

/**
 * Every product, published or not.
 *
 * Service role because RLS is the thing being stepped around, on purpose and
 * in exactly one place. `browserClient` cannot see an unpublished row at all,
 * which is the correct behaviour for the shop and the wrong one for the
 * screen that has to put it back.
 */
async function fetchAllForAdmin(): Promise<Product[]> {
  const { data, error } = await (await serviceClient()).from("products").select(SELECT);
  if (error) throw new Error(`Supabase admin products query failed: ${error.message}`);
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

  async listForAdmin(query: ProductQuery): Promise<ProductListResult> {
    const all = await fetchAllForAdmin();
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

  async getByIdForAdmin(id: string): Promise<Product | null> {
    if (!UUID.test(id)) return null;

    const { data, error } = await (
      await serviceClient()
    )
      .from("products")
      .select(SELECT)
      .eq("id", id)
      .maybeSingle();

    if (error) throw new Error(`Supabase admin product query failed: ${error.message}`);
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

  /**
   * The one write in this file, and the one call that does NOT use the
   * anonymous client. 0002_rls.sql gives the catalogue no update policy at
   * all — deliberately, because nothing should be able to change stock from a
   * browser. So this goes through the service role, which is server-only, and
   * the admin check that authorises it happens in /api/admin/products before
   * this is ever reached.
   */
  async updateVariantStock(variantId: string, stock: number): Promise<Product | null> {
    if (!UUID.test(variantId)) return null;

    const { data, error } = await (
      await serviceClient()
    )
      .from("product_variants")
      .update({ stock: Math.max(0, Math.trunc(stock)) })
      .eq("id", variantId)
      .select("product_id")
      .maybeSingle();

    if (error) throw new Error(`Stock update failed: ${error.message}`);
    if (!data) return null;

    // Read the product back so the caller sees the whole thing consistently,
    // rather than a variant floating free of its product.
    return this.getById((data as { product_id: string }).product_id);
  }

  /**
   * Create or replace a product. Service role, for the same reason as the
   * stock write: 0002_rls.sql gives the catalogue no write policy at all.
   *
   * NOT A TRANSACTION, AND THAT MATTERS. PostgREST has no multi-statement
   * transaction, so this is four calls. The order is chosen so a failure
   * part-way leaves the least bad state: the product row is written first and
   * variants next, because a product with stale images is a cosmetic problem
   * while a product with no variants cannot be added to a bag at all. A
   * failure after the first step leaves the previous images in place rather
   * than none.
   */
  async saveProduct(input: ProductInput, id?: string): Promise<Product> {
    // Same reasoning as getById: `products.id` is a uuid column, so a
    // malformed id raises 22P02 and PostgREST turns that into a 500. An id
    // that cannot name a product means there is no such product.
    if (id !== undefined && !UUID.test(id)) {
      throw new Error("That product no longer exists.");
    }

    const supabase = await serviceClient();

    const row = {
      slug: input.slug,
      name: input.name,
      description: input.description,
      short_description: input.shortDescription,
      price: input.price,
      sale_price: input.salePrice,
      category_slug: input.categorySlug,
      subcategory_slug: input.subcategorySlug,
      fabric: input.fabric,
      pieces: input.pieces,
      care: input.care,
      tags: input.tags,
      is_featured: input.isFeatured,
      is_new_arrival: input.isNewArrival,
      is_made_to_order: input.isMadeToOrder,
      is_active: input.isActive,
    };

    const saved = id
      ? await supabase.from("products").update(row).eq("id", id).select("id").maybeSingle()
      : await supabase.from("products").insert(row).select("id").maybeSingle();

    if (saved.error || !saved.data) {
      // The one failure a shopkeeper can actually act on.
      if (saved.error?.message.includes("products_slug_key")) {
        throw new Error(`The web address "${input.slug}" is already used by another product.`);
      }
      throw new Error(`Could not save the product: ${saved.error?.message ?? "no row returned"}`);
    }

    const productId = (saved.data as { id: string }).id;

    // Variants are upserted on SKU so an existing size keeps its id — and
    // therefore its stock — rather than being deleted and recreated at zero.
    if (input.variants.length > 0) {
      const { error } = await supabase.from("product_variants").upsert(
        input.variants.map((variant) => ({
          product_id: productId,
          sku: variant.sku,
          size: variant.size,
          color_name: variant.colorName,
          color_hex: variant.colorHex,
          stock: Math.max(0, Math.trunc(variant.stock)),
        })),
        { onConflict: "sku" },
      );
      if (error) throw new Error(`Could not save the sizes: ${error.message}`);
    }

    /*
     * Sizes the form no longer lists are retired.
     *
     * Safe to delete outright: `order_items` snapshots the name, size, colour
     * and unit price and holds `variant_id` as a bare uuid with no foreign
     * key, precisely so a past order still reads correctly after the size it
     * refers to has gone.
     */
    const keptSkus = input.variants.map((variant) => variant.sku);
    const retire = supabase.from("product_variants").delete().eq("product_id", productId);
    const { error: retireError } = await (keptSkus.length > 0
      ? retire.not("sku", "in", `(${keptSkus.join(",")})`)
      : retire);
    if (retireError) throw new Error(`Could not remove the old sizes: ${retireError.message}`);

    // Images have no natural key worth upserting on and the list is short, so
    // they are replaced wholesale.
    const { error: clearError } = await supabase
      .from("product_images")
      .delete()
      .eq("product_id", productId);
    if (clearError) throw new Error(`Could not replace the images: ${clearError.message}`);
    if (input.images.length > 0) {
      const { error } = await supabase.from("product_images").insert(
        input.images.map((image, index) => ({
          product_id: productId,
          url: image.url,
          alt: image.alt,
          sort_order: index,
          is_primary: index === 0,
        })),
      );
      if (error) throw new Error(`Could not save the images: ${error.message}`);
    }

    const product = await this.getById(productId);
    if (!product) throw new Error("The product saved but could not be read back.");
    return product;
  }

  /**
   * Atomic reserve, via the function 0007_stock_reservation.sql defines.
   * Service role, because that function is granted to service_role alone —
   * a stock-subtracting RPC a browser could call is a vandalism tool.
   */
  async reserveStock(variantId: string, quantity: number): Promise<number | null> {
    if (!UUID.test(variantId) || !Number.isInteger(quantity) || quantity <= 0) return null;

    const { data, error } = await (
      await serviceClient()
    ).rpc("reserve_variant_stock", { p_variant_id: variantId, p_quantity: quantity });

    if (error) throw new Error(`Could not reserve stock: ${error.message}`);

    // The function returns NULL when the WHERE matched nothing — no such
    // variant, or not enough left. Both mean "not reserved".
    return typeof data === "number" ? data : null;
  }

  async releaseStock(variantId: string, quantity: number): Promise<void> {
    if (!UUID.test(variantId) || !Number.isInteger(quantity) || quantity <= 0) return;

    const { error } = await (
      await serviceClient()
    ).rpc("release_variant_stock", { p_variant_id: variantId, p_quantity: quantity });

    // Deliberately not thrown. A release runs on a path that is already
    // failing, and turning "your order could not be placed" into a 500 helps
    // nobody. The stock is wrong by one until someone corrects it, which is
    // the lesser of the two problems and visible on the stock screen.
    if (error) console.error(`Could not release stock for ${variantId}: ${error.message}`);
  }
}
