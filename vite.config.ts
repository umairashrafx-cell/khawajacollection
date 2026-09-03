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
    },
    pages: [{ path: "/" }],
  },
});
