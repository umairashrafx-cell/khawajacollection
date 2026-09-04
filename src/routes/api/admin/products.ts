/**
 * Admin stock management.
 *
 *   GET  /api/admin/products?q=&page=   the catalogue with stock
 *   POST /api/admin/products            set one variant's stock
 *
 * Like the order endpoint, every handler begins with `adminFromRequest`. This
 * one writes to the catalogue, which is the shared state every shopper sees —
 * a wrong number here oversells a piece that does not exist, or hides one that
 * does.
 *
 * Only stock is writable. See the note on `updateVariantStock` in
 * product-repository.ts for why prices are not.
 */

import { createFileRoute } from "@tanstack/react-router";

import { adminFromRequest } from "@/lib/auth/verify";
import { operations } from "@/config/site";
import { productRepository } from "@/lib/repositories";
import type { Product } from "@/types";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store, private" },
  });
}

/** Just enough to run a stock screen — no descriptions, no image lists. */
function toStockRow(product: Product) {
  const inStock = product.variants.reduce((sum, v) => sum + v.stock, 0);
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    price: product.salePrice ?? product.price,
    categorySlug: product.categorySlug,
    totalStock: inStock,
    variants: product.variants.map((variant) => ({
      id: variant.id,
      sku: variant.sku,
      size: variant.size,
      colorName: variant.colorName,
      stock: variant.stock,
    })),
  };
}

export const Route = createFileRoute("/api/admin/products")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const admin = await adminFromRequest(request);
        if (!admin) return json({ ok: false, error: "Admin access required." }, 403);

        const url = new URL(request.url);
        const q = url.searchParams.get("q")?.trim();
        const filter = url.searchParams.get("filter");
        const page = Number(url.searchParams.get("page") ?? 1) || 1;
        const perPage = 24;

        /*
         * The stock summary is over the WHOLE catalogue, not the current page.
         * A “low stock” count that only saw 24 products would be worse than no
         * count — it would read as reassuring while a sold-out piece sat on
         * page three. Same reasoning as the order counts.
         *
         * At sixty products one full read is trivially cheap. Past a few
         * thousand this belongs in a Postgres aggregate, and that is a change
         * to this file alone.
         */
        const everything = await productRepository.list({ perPage: 1000, sort: "featured" });

        let soldOutVariants = 0;
        let lowStockVariants = 0;
        let soldOutProducts = 0;
        let totalVariants = 0;

        for (const product of everything.items) {
          let productStock = 0;
          for (const variant of product.variants) {
            totalVariants += 1;
            productStock += variant.stock;
            if (variant.stock === 0) soldOutVariants += 1;
            else if (variant.stock <= operations.lowStockThreshold) lowStockVariants += 1;
          }
          if (productStock === 0) soldOutProducts += 1;
        }

        // Filtering happens here rather than in the query because “low stock” is
        // a fact about variants, and ProductQuery filters products.
        const matching = everything.items.filter((product) => {
          if (!q) return true;
          const haystack = `${product.name} ${product.slug}`.toLowerCase();
          return haystack.includes(q.toLowerCase());
        });

        const filtered =
          filter === "soldout"
            ? // BOTH FILTERS ARE ABOUT VARIANTS, NOT PRODUCTS. “Sold out” first
              // meant “every size of this product is gone”, which rendered as
              // “Sold out (0)” on a catalogue with 42 unbuyable sizes — the
              // screen said nothing was wrong while a customer choosing
              // Emerald got nothing. The size someone cannot buy is the thing
              // worth restocking, so one empty size puts a product in the list.
              matching.filter((p) => p.variants.some((v) => v.stock === 0))
            : filter === "low"
              ? matching.filter((p) =>
                  p.variants.some((v) => v.stock > 0 && v.stock <= operations.lowStockThreshold),
                )
              : matching;

        const start = (page - 1) * perPage;

        return json({
          ok: true,
          products: filtered.slice(start, start + perPage).map(toStockRow),
          total: filtered.length,
          page,
          perPage,
          summary: {
            soldOutVariants,
            lowStockVariants,
            soldOutProducts,
            totalVariants,
            lowStockThreshold: operations.lowStockThreshold,
          },
        });
      },

      POST: async ({ request }) => {
        const admin = await adminFromRequest(request);
        if (!admin) return json({ ok: false, error: "Admin access required." }, 403);

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return json({ ok: false, error: "Send a JSON body." }, 400);
        }

        const { variantId, stock } = (body ?? {}) as Record<string, unknown>;

        if (typeof variantId !== "string" || !variantId.trim()) {
          return json({ ok: false, error: "variantId is required." }, 400);
        }
        // Rejected rather than coerced. `Number("")` is 0, so a cleared input
        // would silently mark a piece sold out — the exact mistake that costs
        // a sale and is impossible to spot afterwards.
        if (typeof stock !== "number" || !Number.isFinite(stock) || stock < 0) {
          return json({ ok: false, error: "stock must be a number of 0 or more." }, 400);
        }

        const updated = await productRepository.updateVariantStock(variantId, stock);
        if (!updated) return json({ ok: false, error: "Variant not found." }, 404);

        return json({ ok: true, product: toStockRow(updated) });
      },
    },
  },
});
