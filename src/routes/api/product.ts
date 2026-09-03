/**
 * One product by slug, as JSON.
 *
 * Section 11.6: "'Move to cart' needs a size — open the size picker." The
 * wishlist stores a snapshot, not variants, so the picker fetches the real
 * product on demand rather than the page shipping every wishlisted product's
 * variants up front for a button most visitors never press.
 */

import { createFileRoute } from "@tanstack/react-router";

import { productRepository } from "@/lib/repositories";

export const Route = createFileRoute("/api/product")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const slug = new URL(request.url).searchParams.get("slug")?.trim() ?? "";
        if (!slug) {
          return new Response(JSON.stringify({ error: "slug is required" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        const product = await productRepository.getBySlug(slug);
        if (!product) {
          return new Response(JSON.stringify({ error: "not found" }), {
            status: 404,
            headers: { "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify(product), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "public, max-age=60",
          },
        });
      },
    },
  },
});
