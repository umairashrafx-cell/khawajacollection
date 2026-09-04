// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },

    // docs/BUILD-SPEC.pdf Phase 5 asks for generateStaticParams over every
    // product slug. On TanStack Start that is prerendering: crawl from the
    // homepage, which reaches the listing pages through the header nav and
    // every product through the grids, and write static HTML for each.
    // See the deviation note in CLAUDE.md.
    prerender: {
      enabled: true,
      crawlLinks: true,
      // A slug that 404s should not take the whole build down.
      failOnError: false,
      concurrency: 4,

      /*
       * Private areas are never prerendered. The crawler reached /admin and
       * wrote three static shells — harmless in themselves, since the guard is
       * client-side and every /api/admin route re-checks the role server-side,
       * so the HTML contains no data. But a static file of a staff-only screen
       * sitting on a CDN is the kind of thing that becomes a real leak the
       * first time someone renders data into it during SSR. Cheaper to never
       * start.
       */
      filter: ({ path }: { path: string }) =>
        !path.startsWith("/admin") && !path.startsWith("/account"),
    },
    pages: [{ path: "/" }],
  },

  /**
   * Cache headers. CLAUDE.md records these as Phase 9's stand-in for the ISR
   * the spec assumed we would get from Next.js.
   *
   * A Lighthouse run found every font being served with no Cache-Control at
   * all, so a returning visitor re-downloaded 150 KB of woff2 on each visit.
   * Vercel and Cloudflare add sensible defaults for hashed assets themselves,
   * but the node preset does not, and relying on a host's defaults for
   * something this load-bearing is how it goes unnoticed again.
   */
  /*
   * CAST, AND HERE IS WHY. @lovable.dev/vite-tanstack-config types its `nitro`
   * option as only { preset, output, cloudflare }, saying the surface is
   * "narrow on purpose" while Nitro v3 is pre-RC, and "file an issue if you
   * need more". But it forwards the whole object to nitro(), so the keys below
   * do take effect — verified against a built server: fonts came back with
   * `cache-control: public, max-age=2592000` and assets with the immutable
   * year. Dropping working configuration to satisfy a type that admits it is
   * incomplete would be the wrong trade; the cast is narrowed to this object
   * and documented rather than hidden.
   */
  nitro: {
    /**
     * Pre-compress everything in public/ at build time and serve .br/.gz when
     * the client accepts them.
     *
     * A Lighthouse run against the node-server build scored mobile Performance
     * 60 with an LCP of 7.9s, and the cause was that this preset sends no
     * content-encoding at all: 403 KB of raw JavaScript where the gzipped
     * asset is 119 KB. Vercel and Cloudflare compress on their own, which is
     * exactly why the gap went unnoticed — the numbers only look wrong on the
     * one build you can actually measure locally.
     */
    compressPublicAssets: { gzip: true, brotli: true },

    routeRules: {
      // Content-hashed by the bundler, so the URL changes whenever the bytes
      // do. Immutable is exactly true here.
      "/assets/**": { headers: { "cache-control": "public, max-age=31536000, immutable" } },
      // Fonts are NOT content-hashed (scripts/fetch-fonts.mjs names them by
      // family and weight), so they get a long TTL rather than immutable:
      // re-running that script must be able to take effect.
      // These three only take effect where the SSR handler serves public/ —
      // a node-server or Cloudflare build. On Vercel the CDN serves those
      // files off the filesystem and never runs a route rule, so the real
      // headers for them are written into .vercel/output/config.json by
      // scripts/finalize-vercel-output.mjs. Both places, deliberately: the
      // app should not cache differently depending on where it is deployed.
      "/fonts/**": { headers: { "cache-control": "public, max-age=2592000" } },
      "/og/**": { headers: { "cache-control": "public, max-age=86400" } },
      "/placeholders/**": { headers: { "cache-control": "public, max-age=86400" } },

      // HTML is revalidated but may be served stale while that happens — the
      // closest thing to ISR available here. Anything with a session or an
      // order in it must never be cached by a shared proxy.
      "/**": { headers: { "cache-control": "public, max-age=0, must-revalidate" } },
      // Scoped to the endpoints that carry personal data. A blanket
      // "/api/**": no-store also silently overrode the deliberate
      // `max-age=60` that /api/product sets for the wishlist size-picker,
      // which is public catalogue data and worth caching. Public endpoints
      // set their own headers; these override anything they might get wrong.
      // Public catalogue endpoints, stated explicitly. The catch-all "/**"
      // below overrides whatever a handler sets for itself, so /api/product's
      // own `max-age=60` was being replaced by `max-age=0` — verified in
      // production. A route rule is the only thing that wins here.
      "/api/product": { headers: { "cache-control": "public, max-age=60" } },
      "/api/search": { headers: { "cache-control": "public, max-age=60" } },

      // Everything carrying personal data.
      "/api/orders": { headers: { "cache-control": "no-store" } },
      "/api/track-order": { headers: { "cache-control": "no-store" } },
      "/api/newsletter": { headers: { "cache-control": "no-store" } },
      "/api/account/**": { headers: { "cache-control": "no-store, private" } },
      "/account/**": { headers: { "cache-control": "no-store, private" } },
      "/checkout": { headers: { "cache-control": "no-store, private" } },
      "/cart": { headers: { "cache-control": "no-store, private" } },
    },
  } as unknown as { preset?: string },
});
