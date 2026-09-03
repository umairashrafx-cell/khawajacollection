/**
 * Search suggestions for the search modal. See docs/BUILD-SPEC.pdf Section 11.6.
 *
 * The modal needs "up to 6 matching products with thumbnails" plus matching
 * categories. Doing that in the browser would mean shipping the whole
 * catalogue to every visitor, so it runs here against the repository and
 * returns only what the panel draws.
 */

import { createFileRoute } from "@tanstack/react-router";

import { resolvePrice } from "@/lib/format";
import { categoryRepository, productRepository } from "@/lib/repositories";

const MAX_PRODUCTS = 6;
const MAX_CATEGORIES = 4;

export interface SearchSuggestion {
  slug: string;
  name: string;
  image: string;
  alt: string;
  price: number;
}

export interface SearchSuggestions {
  products: SearchSuggestion[];
  categories: { label: string; href: string }[];
  total: number;
}

function json(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      // Suggestions are catalogue data, not personal — safe to cache briefly.
      "Cache-Control": "public, max-age=60",
    },
  });
}

export const Route = createFileRoute("/api/search")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
        if (q.length === 0) {
          return json({ products: [], categories: [], total: 0 } satisfies SearchSuggestions);
        }

        const [{ items, total }, categories] = await Promise.all([
          productRepository.list({ q, perPage: MAX_PRODUCTS, sort: "featured" }),
          categoryRepository.list(),
        ]);

        const needle = q.toLowerCase();
        // Parent display names, so a suggestion reads "Kurtas in Men" rather
        // than leaking the slug as "Kurtas in men".
        const nameBySlug = new Map(categories.map((category) => [category.slug, category.name]));

        const matchedCategories = categories
          .filter((category) => category.name.toLowerCase().includes(needle))
          .slice(0, MAX_CATEGORIES)
          .map((category) => {
            const parentName = category.parentSlug ? nameBySlug.get(category.parentSlug) : null;
            return {
              label: parentName ? `${category.name} in ${parentName}` : category.name,
              href: category.parentSlug
                ? `/${category.parentSlug}/${category.slug.replace(`${category.parentSlug}-`, "")}`
                : `/${category.slug}`,
            };
          });

        return json({
          products: items.map((product) => {
            const image = product.images[0];
            return {
              slug: product.slug,
              name: product.name,
              image: image?.url ?? "",
              alt: image?.alt ?? product.name,
              price: resolvePrice(product),
            };
          }),
          categories: matchedCategories,
          total,
        } satisfies SearchSuggestions);
      },
    },
  },
});
