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
        const page = Number(url.searchParams.get("page") ?? 1) || 1;

        const result = await productRepository.list({
          ...(q ? { q } : {}),
          page,
          perPage: 24,
          sort: "featured",
        });

        return json({
          ok: true,
          products: result.items.map(toStockRow),
          total: result.total,
          page,
          perPage: 24,
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
