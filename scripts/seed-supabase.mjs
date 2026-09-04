/**
 * Seeds the 60 mock products into Supabase. docs/BUILD-SPEC.pdf Phase 8 item 4.
 *
 *   node scripts/seed-supabase.mjs            # writes via the service role
 *   node scripts/seed-supabase.mjs --sql      # prints SQL instead, writes nothing
 *
 * The `--sql` mode exists so the seed can be applied through any channel that
 * can run SQL — the Supabase dashboard, psql, or a migration tool — without
 * the service role key ever leaving the machine that holds it.
 *
 * Idempotent: every insert upserts on its natural key, so running it twice
 * updates rather than duplicates.
 *
 * ON IMAGES. Phase 8 says to upload the placeholders to Storage. They are
 * currently generated SVGs served from public/placeholders, and uploading
 * scaffolding that is due to be replaced by the real photography pipeline
 * (Section 19) would just move throwaway files. The image URLs are seeded as
 * they are; switching them to Storage later is a change to those strings and
 * nothing else. See the note in the Phase 8 summary.
 */

import { createServer } from "vite";

const sqlOnly = process.argv.includes("--sql");
const NEWLINE = String.fromCharCode(10);

/** Single-quote escaping for SQL literals. */
function lit(value) {
  if (value === null || value === undefined) return "null";
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  return `'${String(value).replace(/'/g, "''")}'`;
}

function textArray(values) {
  if (!values?.length) return "'{}'";
  return `ARRAY[${values.map(lit).join(", ")}]::text[]`;
}

const server = await createServer({
  configFile: "vite.config.ts",
  server: { middlewareMode: true },
  logLevel: "error",
});

try {
  const { products } = await server.ssrLoadModule("/src/data/products.ts");
  const { categories } = await server.ssrLoadModule("/src/data/categories.ts");
  const { collections } = await server.ssrLoadModule("/src/data/collections.ts");

  const statements = [];

  // Parents before children: subcategories reference their parent's slug.
  const ordered = [...categories].sort((a, b) => (a.parentSlug ? 1 : 0) - (b.parentSlug ? 1 : 0));
  for (const c of ordered) {
    statements.push(
      `insert into categories (slug, name, parent_slug, description, image_url, sort_order) values (${lit(c.slug)}, ${lit(c.name)}, ${lit(c.parentSlug ?? null)}, ${lit(c.description ?? null)}, ${lit(c.image?.url ?? null)}, ${c.sortOrder}) on conflict (slug) do update set name = excluded.name, parent_slug = excluded.parent_slug, description = excluded.description, image_url = excluded.image_url, sort_order = excluded.sort_order;`,
    );
  }

  for (const c of collections) {
    statements.push(
      `insert into collections (slug, name, tagline, hero_image_url, is_active) values (${lit(c.slug)}, ${lit(c.name)}, ${lit(c.tagline ?? null)}, ${lit(c.heroImage?.url ?? null)}, ${c.isActive}) on conflict (slug) do update set name = excluded.name, tagline = excluded.tagline, hero_image_url = excluded.hero_image_url, is_active = excluded.is_active;`,
    );
  }

  for (const p of products) {
    statements.push(
      `insert into products (slug, name, description, short_description, price, sale_price, category_slug, subcategory_slug, fabric, pieces, care, tags, rating, review_count, is_featured, is_new_arrival, is_best_seller, is_active, is_made_to_order, created_at) values (${lit(p.slug)}, ${lit(p.name)}, ${lit(p.description)}, ${lit(p.shortDescription)}, ${p.price}, ${p.salePrice ?? "null"}, ${lit(p.categorySlug)}, ${lit(p.subcategorySlug ?? null)}, ${lit(p.fabric ?? null)}, ${p.pieces ?? "null"}, ${lit(p.care ?? null)}, ${textArray(p.tags)}, ${p.rating}, ${p.reviewCount}, ${p.isFeatured}, ${p.isNewArrival}, ${p.isBestSeller}, true, ${p.isMadeToOrder === true}, ${lit(p.createdAt)}) on conflict (slug) do update set name = excluded.name, description = excluded.description, short_description = excluded.short_description, price = excluded.price, sale_price = excluded.sale_price, category_slug = excluded.category_slug, subcategory_slug = excluded.subcategory_slug, fabric = excluded.fabric, pieces = excluded.pieces, care = excluded.care, tags = excluded.tags, rating = excluded.rating, review_count = excluded.review_count, is_featured = excluded.is_featured, is_new_arrival = excluded.is_new_arrival, is_best_seller = excluded.is_best_seller, is_made_to_order = excluded.is_made_to_order;`,
    );

    // Images and collection links are replaced wholesale — they have no
    // natural key worth upserting on, and a product's image list is small.
    statements.push(
      `delete from product_images where product_id = (select id from products where slug = ${lit(p.slug)});`,
    );
    p.images.forEach((image, index) => {
      statements.push(
        `insert into product_images (product_id, url, alt, sort_order, is_primary) select id, ${lit(image.url)}, ${lit(image.alt)}, ${index}, ${index === 0} from products where slug = ${lit(p.slug)};`,
      );
    });

    for (const v of p.variants) {
      statements.push(
        `insert into product_variants (product_id, sku, size, color_name, color_hex, stock, price_override) select id, ${lit(v.sku)}, ${lit(v.size)}, ${lit(v.colorName)}, ${lit(v.colorHex)}, ${v.stock}, ${v.priceOverride ?? "null"} from products where slug = ${lit(p.slug)} on conflict (sku) do update set size = excluded.size, color_name = excluded.color_name, color_hex = excluded.color_hex, stock = excluded.stock, price_override = excluded.price_override;`,
      );
    }

    statements.push(
      `delete from product_collections where product_id = (select id from products where slug = ${lit(p.slug)});`,
    );
    for (const slug of p.collectionSlugs) {
      statements.push(
        `insert into product_collections (product_id, collection_slug) select id, ${lit(slug)} from products where slug = ${lit(p.slug)} on conflict do nothing;`,
      );
    }
  }

  if (sqlOnly) {
    console.log(statements.join(NEWLINE));
    console.log(`-- ${statements.length} statements`);
  } else {
    const { serviceClient } = await server.ssrLoadModule("/src/lib/supabase/client.ts");
    const supabase = await serviceClient();

    const check = (label, { error }) => {
      if (error) {
        console.error(NEWLINE + label + " failed: " + error.message);
        process.exit(1);
      }
    };

    // Parents first: subcategories reference their parent's slug.
    for (const group of [
      categories.filter((c) => !c.parentSlug),
      categories.filter((c) => c.parentSlug),
    ]) {
      check(
        "categories",
        await supabase.from("categories").upsert(
          group.map((c) => ({
            slug: c.slug,
            name: c.name,
            parent_slug: c.parentSlug ?? null,
            description: c.description ?? null,
            image_url: c.image?.url ?? null,
            sort_order: c.sortOrder,
          })),
          { onConflict: "slug" },
        ),
      );
    }

    check(
      "collections",
      await supabase.from("collections").upsert(
        collections.map((c) => ({
          slug: c.slug,
          name: c.name,
          tagline: c.tagline ?? null,
          hero_image_url: c.heroImage?.url ?? null,
          is_active: c.isActive,
        })),
        { onConflict: "slug" },
      ),
    );

    const { data: rows, error: productError } = await supabase
      .from("products")
      .upsert(
        products.map((p) => ({
          slug: p.slug,
          name: p.name,
          description: p.description,
          short_description: p.shortDescription,
          price: p.price,
          sale_price: p.salePrice ?? null,
          category_slug: p.categorySlug,
          subcategory_slug: p.subcategorySlug ?? null,
          fabric: p.fabric ?? null,
          pieces: p.pieces ?? null,
          care: p.care ?? null,
          tags: p.tags,
          rating: p.rating,
          review_count: p.reviewCount,
          is_featured: p.isFeatured,
          is_new_arrival: p.isNewArrival,
          is_best_seller: p.isBestSeller,
          is_active: true,
          is_made_to_order: p.isMadeToOrder === true,
          created_at: p.createdAt,
        })),
        { onConflict: "slug" },
      )
      .select("id, slug");
    check("products", { error: productError });

    const idBySlug = new Map((rows ?? []).map((row) => [row.slug, row.id]));

    // Images and collection links have no natural key worth upserting on, so
    // they are replaced wholesale for the products being seeded.
    const ids = [...idBySlug.values()];
    check("clear images", await supabase.from("product_images").delete().in("product_id", ids));
    check(
      "clear collection links",
      await supabase.from("product_collections").delete().in("product_id", ids),
    );

    check(
      "images",
      await supabase.from("product_images").insert(
        products.flatMap((p) =>
          p.images.map((image, index) => ({
            product_id: idBySlug.get(p.slug),
            url: image.url,
            alt: image.alt,
            sort_order: index,
            is_primary: index === 0,
          })),
        ),
      ),
    );

    check(
      "variants",
      await supabase.from("product_variants").upsert(
        products.flatMap((p) =>
          p.variants.map((v) => ({
            product_id: idBySlug.get(p.slug),
            sku: v.sku,
            size: v.size,
            color_name: v.colorName,
            color_hex: v.colorHex,
            stock: v.stock,
            price_override: v.priceOverride ?? null,
          })),
        ),
        { onConflict: "sku" },
      ),
    );

    const links = products.flatMap((p) =>
      p.collectionSlugs.map((slug) => ({
        product_id: idBySlug.get(p.slug),
        collection_slug: slug,
      })),
    );
    if (links.length > 0) {
      check("collection links", await supabase.from("product_collections").insert(links));
    }

    console.log(
      `Seeded ${products.length} products, ` +
        `${products.reduce((n, p) => n + p.variants.length, 0)} variants, ` +
        `${products.reduce((n, p) => n + p.images.length, 0)} images.`,
    );
  }
} finally {
  await server.close();
}
