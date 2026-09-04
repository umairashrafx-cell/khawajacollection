/**
 * Resolve product ids to wishlist snapshots.
 *
 * The `wishlists` table in Section 8.3 stores `(user_id, product_id)` and
 * nothing else, which is right — a wishlist should not carry a stale copy of a
 * price. But the wishlist page renders a name, an image and a price without
 * shipping the catalogue to the browser, so on login the account's bare ids
 * have to become the same snapshot shape the guest list already uses.
 *
 * Only catalogue data is returned, so no authentication is needed: everything
 * here is already public on the product page. Which ids a customer *asks*
 * about is theirs, but the answer reveals nothing new.
 */

import { createFileRoute } from "@tanstack/react-router";

import { resolvePrice } from "@/lib/format";
import { productRepository } from "@/lib/repositories";

/** A wishlist is small, and an unbounded id list is a free fan-out of queries. */
const MAX_IDS = 100;

export const Route = createFileRoute("/api/wishlist-entries")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const raw = new URL(request.url).searchParams.get("ids")?.trim() ?? "";
        const ids = [
          ...new Set(
            raw
              .split(",")
              .map((id) => id.trim())
              .filter(Boolean),
          ),
        ].slice(0, MAX_IDS);

        if (ids.length === 0) {
          return new Response(JSON.stringify({ entries: [] }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }

        const products = await Promise.all(ids.map((id) => productRepository.getById(id)));

        // A product that has since been delisted is dropped rather than
        // rendered as a broken card. The customer loses a row they could no
        // longer buy anyway.
        const entries = products.flatMap((product) => {
          if (!product) return [];
          const image = product.images[0];
          return [
            {
              productId: product.id,
              slug: product.slug,
              name: product.name,
              image: image?.url ?? "",
              alt: image?.alt ?? product.name,
              price: resolvePrice(product),
            },
          ];
        });

        return new Response(JSON.stringify({ entries }), {
          status: 200,
          headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
        });
      },
    },
  },
});
