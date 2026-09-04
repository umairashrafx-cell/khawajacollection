/**
 * sitemap.xml, generated from the repository. docs/BUILD-SPEC.pdf Section 13:
 *
 *   "generated from the repository: all static routes + every product,
 *    category, and collection slug, with lastModified."
 *
 * THIS REPLACES A SITEMAP THAT WAS ACTIVELY HARMFUL. The Lovable-era version
 * read `src/data/legacy/`, a 16-product snapshot, and emitted `/category/{slug}`
 * and `/product/{slug}` — the pre-Phase-4 URLs, every one of which now answers
 * with a 301. A sitemap is a list of pages you are asking Google to index, so
 * it was asking for 16 redirects while the 60 real products went unlisted.
 *
 * Nothing here is disallowed in robots.txt. A sitemap that lists a blocked URL
 * is a contradiction Search Console reports as an error, so the two files are
 * deliberately built from the same understanding of what is public.
 */

import { createFileRoute } from "@tanstack/react-router";

import { categoryRepository, collectionRepository, productRepository } from "@/lib/repositories";
import { hasRealOrigin, absoluteUrl } from "@/lib/seo";

interface Entry {
  path: string;
  changefreq: "daily" | "weekly" | "monthly";
  priority: string;
  lastmod?: string;
}

/**
 * Editorial and evergreen routes. The commerce ones (cart, checkout, account, admin,
 * the auth pages) are absent on purpose — they are `noindex` and disallowed.
 */
const STATIC: Entry[] = [
  { path: "/", changefreq: "daily", priority: "1.0" },
  { path: "/new-arrivals", changefreq: "daily", priority: "0.9" },
  { path: "/sale", changefreq: "daily", priority: "0.9" },
  { path: "/bridal", changefreq: "weekly", priority: "0.8" },
  { path: "/ready-to-wear", changefreq: "weekly", priority: "0.8" },
  { path: "/unstitched", changefreq: "weekly", priority: "0.8" },
  { path: "/track-order", changefreq: "monthly", priority: "0.4" },
  { path: "/about", changefreq: "monthly", priority: "0.5" },
  { path: "/contact", changefreq: "monthly", priority: "0.5" },
  { path: "/faqs", changefreq: "monthly", priority: "0.5" },
  { path: "/shipping", changefreq: "monthly", priority: "0.4" },
  { path: "/returns", changefreq: "monthly", priority: "0.4" },
  { path: "/refund-policy", changefreq: "monthly", priority: "0.3" },
  { path: "/privacy", changefreq: "monthly", priority: "0.3" },
  { path: "/terms", changefreq: "monthly", priority: "0.3" },
];

/**
 * `women-formals` lives at `/women/formals`: the slug is globally unique and
 * carries its parent as a prefix, but the URL nests instead of repeating it.
 */
function subcategoryPath(parentSlug: string, childSlug: string): string {
  const segment = childSlug.startsWith(`${parentSlug}-`)
    ? childSlug.slice(parentSlug.length + 1)
    : childSlug;
  return `/${parentSlug}/${segment}`;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function toXml(entries: Entry[], toUrl: (path: string) => string): string {
  const body = entries
    .map((entry) => {
      const parts = [
        `    <loc>${escapeXml(toUrl(entry.path))}</loc>`,
        entry.lastmod ? `    <lastmod>${entry.lastmod}</lastmod>` : null,
        `    <changefreq>${entry.changefreq}</changefreq>`,
        `    <priority>${entry.priority}</priority>`,
      ].filter(Boolean);
      return `  <url>\n${parts.join("\n")}\n  </url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const [tree, collections, slugs] = await Promise.all([
          categoryRepository.tree(),
          collectionRepository.list(),
          productRepository.getAllSlugs(),
        ]);

        // `lastModified` per Section 13. Products carry a real createdAt; the
        // taxonomy has no timestamp in Section 8.3, so those entries carry
        // none rather than a date we made up — an invented lastmod teaches a
        // crawler to distrust every date in the file.
        const products = await Promise.all(slugs.map((slug) => productRepository.getBySlug(slug)));

        const entries: Entry[] = [
          ...STATIC,

          ...tree.flatMap((parent) => [
            { path: `/${parent.slug}`, changefreq: "weekly" as const, priority: "0.9" },
            ...parent.children.map((child) => ({
              path: subcategoryPath(parent.slug, child.slug),
              changefreq: "weekly" as const,
              priority: "0.8",
            })),
          ]),

          ...collections
            .filter((collection) => collection.isActive)
            .map((collection) => ({
              path: `/collections/${collection.slug}`,
              changefreq: "weekly" as const,
              priority: "0.7",
            })),

          ...products.flatMap((product) =>
            product
              ? [
                  {
                    path: `/products/${product.slug}`,
                    changefreq: "weekly" as const,
                    priority: "0.8",
                    lastmod: product.createdAt.slice(0, 10),
                  },
                ]
              : [],
          ),
        ];

        // Absolute URLs are required in a sitemap, and unlike a canonical there
        // is no relative fallback the format accepts. When VITE_SITE_URL is
        // unset the request's own origin is the only honest answer.
        const origin = new URL(request.url).origin;
        const toUrl = (path: string) => (hasRealOrigin() ? absoluteUrl(path) : `${origin}${path}`);

        return new Response(toXml(entries, toUrl), {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
