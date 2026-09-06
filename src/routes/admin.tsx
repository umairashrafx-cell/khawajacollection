/**
 * The admin shell: a guard, a nav, and an outlet.
 *
 * DELIBERATELY DOES NOT LOOK LIKE THE SHOP. The storefront is sand and serif
 * and generous whitespace; this is a dark bar, tight rows and a dense table.
 * Staff move between the two all day, and every destructive thing here happens
 * to a real customer's order — "which one am I looking at" should be answerable
 * from the corner of your eye, not by reading the URL.
 *
 * THE GUARD HIDES; IT DOES NOT PROTECT. It decides whether a screen renders.
 * The data behind it is protected by every /api/admin/* handler independently
 * calling `adminFromRequest`, which asks Supabase. Defeat this guard and you
 * get empty tables and 403s.
 *
 * It asks the server (`useAdminAccess`) rather than reading the role out of
 * the session this browser is holding. That session is a snapshot taken at
 * sign-in, so an account granted admin afterwards was shown “Not an admin
 * account” while every API call would have succeeded — the UI contradicting
 * the server, with nothing on screen to explain it.
 *
 * noindex, and disallowed in robots.txt.
 */

import { createFileRoute, Outlet, useLocation } from "@tanstack/react-router";

import { AdminNav } from "@/components/admin/AdminNav";
import { AppLink } from "@/components/layout/AppLink";
import { signOut } from "@/lib/auth/actions";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import { useAuth } from "@/lib/auth/session-store";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-kc-sand">
      <div className="mx-auto max-w-md px-4 py-24 text-center">{children}</div>
    </div>
  );
}

function AdminLayout() {
  const { user, ready } = useAuth();
  // The SERVER decides, not the token this browser is holding. See
  // src/hooks/useAdminAccess.ts.
  const { isAdmin, isPending: checking } = useAdminAccess();
  const { pathname } = useLocation();

  if (!isSupabaseConfigured()) {
    return (
      <Shell>
        <h1 className="font-display text-2xl">Admin is not available</h1>
        <p className="mt-3 text-sm text-kc-charcoal">
          This deployment runs without a database, so there are no orders to manage.
        </p>
      </Shell>
    );
  }

  // First render is always "not ready" on server and client alike, which is
  // what keeps hydration honest. See session-store.ts. `checking` also
  // covers the whoami round trip, so a real admin never sees a refusal
  // flash before the answer arrives.
  if (!ready || checking) {
    return (
      <Shell>
        <p className="text-sm text-kc-muted">Checking your access…</p>
      </Shell>
    );
  }

  if (!user) {
    return (
      <Shell>
        <h1 className="font-display text-2xl">Sign in</h1>
        <p className="mt-3 text-sm text-kc-charcoal">The admin area needs a staff account.</p>
        <AppLink
          href={`/login?next=${encodeURIComponent(pathname)}`}
          className="mt-6 inline-flex min-h-11 items-center justify-center bg-kc-ink px-6 text-sm tracking-wide text-kc-white"
        >
          Sign in
        </AppLink>
      </Shell>
    );
  }

  if (!isAdmin) {
    return (
      <Shell>
        <h1 className="font-display text-2xl">Not an admin account</h1>
        <p className="mt-3 text-sm text-kc-charcoal">
          You are signed in as {user.email}, and the server does not list that account as staff.
        </p>
        <p className="mt-3 text-sm text-kc-charcoal">
          If the role was granted after you last signed in, signing out and back in will pick it up.
          Otherwise it is granted in Supabase — see <code>docs/LAUNCH-CHECKLIST.md</code>.
        </p>
        <button
          type="button"
          onClick={() => void signOut()}
          className="mt-6 inline-flex min-h-11 items-center justify-center bg-kc-ink px-6 text-sm tracking-wide text-kc-white"
        >
          Sign out and try again
        </button>
        <AppLink
          href="/"
          className="mt-3 inline-flex min-h-11 items-center justify-center border border-kc-line px-6 text-sm tracking-wide text-kc-ink"
        >
          Back to the shop
        </AppLink>
      </Shell>
    );
  }

  return (
    <div className="min-h-screen bg-kc-sand">
      <AdminNav pathname={pathname} onSignOut={() => void signOut()} />

      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
