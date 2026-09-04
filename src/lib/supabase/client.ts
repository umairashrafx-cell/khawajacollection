/**
 * Supabase clients. See docs/BUILD-SPEC.pdf Section 4.3, Phase 8, and the
 * Section 14 performance budget.
 *
 * Two clients, and the difference between them is the whole security story:
 *
 *   browserClient() — the publishable key. Ships to the browser, and is meant
 *   to. Everything it can reach is governed by the RLS policies in
 *   supabase/migrations/0002_rls.sql, which is why those policies matter.
 *
 *   serviceClient() — the service role key. Bypasses RLS entirely. Server
 *   only, never imported by a component, and it throws rather than degrade if
 *   the key is missing.
 *
 * GUARDRAIL 4: the service role key is read from the server environment at
 * call time. It is never written into source, never prefixed `VITE_`, and so
 * never reaches a bundle. Vite inlines anything beginning with `VITE_` into
 * client code — that prefix is the boundary, and the service key stays on the
 * far side of it.
 *
 * BOTH ACCESSORS ARE ASYNC, AND THAT IS A PERFORMANCE DECISION. Phase 9
 * measured the homepage at 210 KB of gzipped JavaScript against a 180 KB
 * budget, and 53 KB of that — 29% of the whole budget — was
 * `@supabase/supabase-js`, dragged onto the critical path of every page by a
 * static import here. A shopper browsing the catalogue never needs it: pages
 * are server-rendered, and the library only does anything once someone signs
 * in or opens an account page.
 *
 * So it is `import()`ed on first use. Every call site was already inside an
 * async function, so this cost nothing at any of them. `import type` is erased
 * at compile time and does not pull the runtime in.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

type SupabaseModule = typeof import("@supabase/supabase-js");

/** One in-flight import, shared. Two callers must not fetch the chunk twice. */
let modulePromise: Promise<SupabaseModule> | null = null;

function loadSupabase(): Promise<SupabaseModule> {
  modulePromise ??= import("@supabase/supabase-js");
  return modulePromise;
}

function requireEnv(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(
      `${name} is not set. Copy .env.example to .env.local and fill in the Supabase values.`,
    );
  }
  return value;
}

export function supabaseUrl(): string {
  return requireEnv(import.meta.env.VITE_SUPABASE_URL, "VITE_SUPABASE_URL");
}

/**
 * Whether this deployment has Supabase at all.
 *
 * Phase 8 item 6 requires the mock repository to stay a valid way to run the
 * whole site, and a mock deployment has no Supabase credentials. Anything that
 * would otherwise throw on a missing key — the account pages, sign-in — asks
 * this first and says so plainly instead of white-screening.
 *
 * Synchronous and cheap: it reads values Vite inlined at build time and never
 * loads the library, so it is safe to call during render.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
}

/**
 * Anonymous, RLS-governed client. Safe in the browser and on the server.
 * Reads the catalogue; can never read an order.
 */
let browser: SupabaseClient | null = null;

export async function browserClient(): Promise<SupabaseClient> {
  if (browser) return browser;

  const { createClient } = await loadSupabase();

  // Checked again after the await: two concurrent callers can both pass the
  // guard above before either finishes importing, and two clients would mean
  // two competing auth listeners fighting over one stored session.
  if (browser) return browser;

  browser = createClient(
    supabaseUrl(),
    requireEnv(import.meta.env.VITE_SUPABASE_ANON_KEY, "VITE_SUPABASE_ANON_KEY"),
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    },
  );
  return browser;
}

/**
 * Full-access client for server routes only: order creation, guest tracking,
 * and the seed script. Importing this from a component is a bug — the key it
 * needs does not exist in the browser, so it will throw there rather than
 * leak.
 */
export async function serviceClient(): Promise<SupabaseClient> {
  const key = typeof process !== "undefined" ? process.env["SUPABASE_SERVICE_ROLE_KEY"] : undefined;

  if (!key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set. It is server-only and must never carry a VITE_ prefix.",
    );
  }

  const { createClient } = await loadSupabase();
  return createClient(supabaseUrl(), key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
