/**
 * robots.txt. docs/BUILD-SPEC.pdf Section 13:
 *
 *   "app/robots.ts: allow all, disallow /checkout, /account, /cart, /wishlist,
 *    /api. Point to the sitemap."
 *
 * The auth pages are disallowed too. They are not in the spec's list because
 * the spec wrote that list before Phase 8 added them, but they carry the same
 * `noindex` for the same reason: a sign-in form has nothing for a searcher and
 * is the single most useful page on a shop for someone building a convincing
 * phishing result.
 *
 * ON THE SITEMAP LINE. `Sitemap:` must be an absolute URL — it is the one
 * directive in the file that a relative path is invalid for. When
 * VITE_SITE_URL is unset there is no honest absolute URL to give, so the line
 * is derived from the request's own origin, which is correct on any host the
 * site actually answers on.
 */

import { createFileRoute } from "@tanstack/react-router";

import { hasRealOrigin, absoluteUrl } from "@/lib/seo";

const DISALLOW = [
  "/api/",
  "/cart",
  "/checkout",
  "/account",
  "/admin",
  "/wishlist",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  // The legacy redirect shells from before Phase 4. They 301 to the real URL,
  // so there is nothing to gain from crawling them and a little to lose.
  "/category/",
  "/product/",
];

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: ({ request }) => {
        const origin = hasRealOrigin() ? absoluteUrl("") : new URL(request.url).origin;

        const body = [
          "User-agent: *",
          "Allow: /",
          ...DISALLOW.map((path) => `Disallow: ${path}`),
          "",
          `Sitemap: ${origin}/sitemap.xml`,
          "",
        ].join("\n");

        return new Response(body, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
