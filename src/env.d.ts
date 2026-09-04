/**
 * The environment variables this app reads, declared so they can be accessed
 * with dot notation.
 *
 * THIS FILE IS A PERFORMANCE FIX, NOT BOOKKEEPING. Vite replaces
 * `import.meta.env.VITE_FOO` with a string literal at build time. It does NOT
 * do that for `import.meta.env["VITE_FOO"]` — bracket access falls back to
 * inlining the *entire* env object and doing a property lookup at runtime.
 *
 * That difference had a real cost. `src/lib/repositories/index.ts` picks its
 * implementation from `VITE_PRODUCT_REPOSITORY`, and with bracket access
 * Rollup could not tell which branch was live, so it kept both — shipping the
 * whole 60-product mock catalogue, names, prices and blurbs, to every browser
 * even on a Supabase deployment. Roughly 12 KB gzipped of data that has no
 * business leaving the server.
 *
 * Bracket access was not a style choice: `noPropertyAccessFromIndexSignature`
 * in tsconfig forbids dot access on an index signature, and without these
 * declarations `ImportMetaEnv` is exactly that. Declaring the variables gives
 * them real properties, which satisfies both TypeScript and Vite.
 *
 * Add a variable here when you add one to .env.example.
 */

/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Production origin. Canonicals, Open Graph URLs and the sitemap depend on it. */
  readonly VITE_SITE_URL?: string;
  /** "mock" (default) or "supabase". */
  readonly VITE_PRODUCT_REPOSITORY?: string;
  readonly VITE_SUPABASE_URL?: string;
  /** The publishable key. Public by design; everything it reaches is under RLS. */
  readonly VITE_SUPABASE_ANON_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
