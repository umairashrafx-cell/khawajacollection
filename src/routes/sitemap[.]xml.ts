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
 *
 * AN EMPTY LISTING IS NOT LISTED, for that same reason taken one step further.
 * After the seed catalogue was deleted this file advertised 38 URLs with
 * nothing on them and one real product — asking Google to index a shop and
 * then showing it an empty room. The listing pages now answer `noindex` while
 * they are empty (see `catalogHead`), and a sitemap asking for a URL the page
 * itself refuses is the same self-contradiction as one asking for a blocked
 * URL. Both sides call `listingHasProducts`, so they cannot drift apart.
 *
 * The evergreen routes are exempt: /about and /contact are pages in their own
 * right rather than shelves, and are worth finding whether or not anything is
 * in stock.
 */

import { createFileRoute } from "@tanstack/react-router";

import {
  bridalCatalog,
  newArrivalsCatalog,
  readyToWearCatalog,
  saleCatalog,
  unstitchedCatalog,
} from "@/config/catalog-routes";
import { listingHasProducts } from "@/lib/catalog-page";
import {
  categoryRepository,
  collectionRepository,
  productRepository,
  type ProductQuery,
} from "@/lib/repositories";
import { hasRealOrigin, absoluteUrl } from "@/lib/seo";

interface Entry {
  path: string;
  changefreq: "daily" | "weekly" | "monthly";
  priority: string;
  lastmod?: string;
}

/**
 * Routes that exist whether or not anything is in stock. The commerce ones
 * (cart, checkout, account, admin, the auth pages) are absent on purpose —
 * they are `noindex` and disallowed.
 */
const EVERGREEN: Entry[] = [
  { path: "/", changefreq: "daily", priority: "1.0" },
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
 * The cross-cutting listings, taken from THE DESCRIPTORS THE ROUTES THEMSELVES
 * USE rather than from a second list of paths. `/sale` is in the sitemap
 * exactly when `saleCatalog.base` matches something, which is exactly when the
 * page has products on it. Restating the query here would be a second source
 * of truth for what "on sale" means.
 */
const TAG_LISTINGS = [
  { catalog: newArrivalsCatalog, changefreq: "daily" as const, priority: "0.9" },
  { catalog: saleCatalog, changefreq: "daily" as const, priority: "0.9" },
  { catalog: bridalCatalog, changefreq: "weekly" as const, priority: "0.8" },
  { catalog: readyToWearCatalog, changefreq: "weekly" as const, priority: "0.8" },
  { catalog: unstitchedCatalog, changefreq: "weekly" as const, priority: "0.8" },
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
        const [tree, collections, catalogue] = await Promise.all([
          categoryRepository.tree(),
          collectionRepository.list(),
          /*
           * ONE READ FOR THE WHOLE CATALOGUE, which it did not used to be:
           * `getAllSlugs()` followed by a `getBySlug()` per slug was a query
           * per product, and this file needs the product objects anyway — for
           * `lastmod`, and now to decide which listings have anything in them.
           * `perPage` is set past any catalogue this shop will hold because
           * both repositories otherwise default it to a page of results.
           */
          productRepository.list({ perPage: 100_000 }),
        ]);

        const products = catalogue.items;
        const stocked = (base: ProductQuery) => listingHasProducts(products, base);

        // `lastModified` per Section 13. Products carry a real createdAt; the
        // taxonomy has no timestamp in Section 8.3, so those entries carry
        // none rather than a date we made up — an invented lastmod teaches a
        // crawler to distrust every date in the file.
        const entries: Entry[] = [
          ...EVERGREEN,

          ...TAG_LISTINGS.filter(({ catalog }) => stocked(catalog.base)).map(
            ({ catalog, changefreq, priority }) => ({ path: catalog.path, changefreq, priority }),
          ),

          ...tree.flatMap((parent) => [
            ...(stocked({ category: parent.slug })
              ? [{ path: `/${parent.slug}`, changefreq: "weekly" as const, priority: "0.9" }]
              : []),
            /*
             * A child is judged on its own. A department can be worth indexing
             * while three of its four shelves are bare, and listing the empty
             * ones because the parent has stock would put back exactly the
             * thin pages this is here to keep out.
             */
            ...parent.children
              .filter((child) => stocked({ category: parent.slug, subcategory: child.slug }))
              .map((child) => ({
                path: subcategoryPath(parent.slug, child.slug),
                changefreq: "weekly" as const,
                priority: "0.8",
              })),
          ]),

          ...collections
            .filter((collection) => collection.isActive && stocked({ collection: collection.slug }))
            .map((collection) => ({
              path: `/collections/${collection.slug}`,
              changefreq: "weekly" as const,
              priority: "0.7",
            })),

          ...products.map((product) => ({
            path: `/products/${product.slug}`,
            changefreq: "weekly" as const,
            priority: "0.8",
            lastmod: product.createdAt.slice(0, 10),
          })),
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
