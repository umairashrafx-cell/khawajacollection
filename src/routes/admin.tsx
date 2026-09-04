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
import { Boxes, ClipboardList, FolderTree, LayoutDashboard, LogOut, Store } from "lucide-react";

import { AppLink } from "@/components/layout/AppLink";
import { signOut } from "@/lib/auth/actions";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import { useAuth } from "@/lib/auth/session-store";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/orders", label: "Orders", icon: ClipboardList, exact: false },
  { href: "/admin/products", label: "Stock", icon: Boxes, exact: false },
  { href: "/admin/categories", label: "Categories", icon: FolderTree, exact: false },
] as const;

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
      <header className="bg-kc-ink text-kc-paper">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3">
          <span className="font-display text-lg tracking-[0.16em]">
            KC<span className="text-kc-gold">.</span>
            <span className="ml-2 align-middle text-[10px] uppercase tracking-[0.18em] text-kc-paper/60">
              Admin
            </span>
          </span>

          <nav aria-label="Admin" className="flex items-center gap-1">
            {NAV.map((item) => {
              const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <AppLink
                  key={item.href}
                  href={item.href}
                  {...(active ? { "aria-current": "page" as const } : {})}
                  className={`flex min-h-11 items-center gap-2 px-3 text-sm transition-colors ${
                    active ? "text-kc-paper" : "text-kc-paper/60 hover:text-kc-paper"
                  }`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {item.label}
                </AppLink>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-1">
            <AppLink
              href="/"
              className="flex min-h-11 items-center gap-2 px-3 text-sm text-kc-paper/60 transition-colors hover:text-kc-paper"
            >
              <Store className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">View shop</span>
            </AppLink>
            <button
              type="button"
              onClick={() => void signOut()}
              className="flex min-h-11 items-center gap-2 px-3 text-sm text-kc-paper/60 transition-colors hover:text-kc-paper"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
