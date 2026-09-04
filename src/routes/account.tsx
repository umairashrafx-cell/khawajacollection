/**
 * The account area: a guard, a nav, and an outlet.
 * docs/BUILD-SPEC.pdf Section 11.6 — "Pages: profile, orders, order detail,
 * addresses, wishlist. All noindex."
 *
 * THE GUARD HERE HIDES; IT DOES NOT PROTECT. The session lives in browser
 * storage, so this check runs in the browser and anyone determined enough can
 * skip it. That is fine, because there is nothing behind it to take: orders
 * come from /api/account/orders, which verifies the access token against
 * Supabase before it reads anything, and addresses come straight from Postgres
 * under RLS policies keyed on `auth.uid()`. Defeat this guard and you get an
 * empty page, because nothing will answer you. See session-store.ts.
 *
 * Every child sets its own noindex. Inheriting it would be tidier and would
 * also mean one forgotten `head()` quietly indexes someone's order history.
 */

import { createFileRoute, Outlet, useLocation } from "@tanstack/react-router";
import { Heart, LogOut, MapPin, PackageSearch, User } from "lucide-react";

import { AppLink } from "@/components/layout/AppLink";
import { Container } from "@/components/layout/Container";
import { signOut } from "@/lib/auth/actions";
import { useAuth } from "@/lib/auth/session-store";
import { isSupabaseConfigured } from "@/lib/supabase/client";

/**
 * NO `head()` HERE, DELIBERATELY, AND IT IS THE ONE EXCEPTION TO HARD RULE 2.
 *
 * This is a layout, not a page: /account itself is served by account/index.tsx.
 * TanStack merges a layout's head with its child's, and while it de-duplicates
 * `meta` by name it does not de-duplicate `links` — so a canonical here plus a
 * canonical in each child shipped TWO <link rel="canonical"> tags on every
 * account page, pointing at different URLs. Two canonicals is worse than a
 * wrong one: a crawler discards the signal entirely.
 *
 * Every child route declares its own title, description, canonical and
 * noindex, so nothing is lost by this file staying quiet.
 */
export const Route = createFileRoute("/account")({
  component: AccountLayout,
});

const NAV = [
  { href: "/account", label: "Profile", icon: User, exact: true },
  { href: "/account/orders", label: "Orders", icon: PackageSearch, exact: false },
  { href: "/account/addresses", label: "Addresses", icon: MapPin, exact: false },
  { href: "/wishlist", label: "Wishlist", icon: Heart, exact: true },
] as const;

function AccountLayout() {
  const { user, ready } = useAuth();
  const { pathname } = useLocation();

  // Phase 8 item 6 keeps the mock repository a valid way to run the whole
  // site, and a mock deployment has no Supabase at all. Saying so beats a
  // sign-in form that can never succeed.
  if (!isSupabaseConfigured()) {
    return (
      <Container>
        <div className="mx-auto max-w-md py-16 text-center">
          <h1 className="font-display text-[28px] leading-tight">Accounts are not available</h1>
          <p className="mt-3 text-sm text-kc-charcoal">
            This deployment runs without a database. Browsing, the bag and checkout all work, and
            any order can be followed with its number on the{" "}
            <AppLink href="/track-order" className="underline underline-offset-4">
              tracking page
            </AppLink>
            .
          </p>
        </div>
      </Container>
    );
  }

  // The first render is always "not ready" — server and client agree on that,
  // which is the point (session-store.ts). A spinner for one tick beats a
  // hydration mismatch.
  if (!ready) {
    return (
      <Container>
        <div className="py-16 text-sm text-kc-muted">Loading your account…</div>
      </Container>
    );
  }

  if (!user) {
    return (
      <Container>
        <div className="mx-auto max-w-md py-16 text-center">
          <h1 className="font-display text-[28px] leading-tight">Sign in to continue</h1>
          <p className="mt-3 text-sm text-kc-charcoal">
            Your orders and saved addresses live behind your account.
          </p>
          <div className="mt-8 flex flex-col gap-3">
            <AppLink
              href={`/login?next=${encodeURIComponent(pathname)}`}
              className="flex min-h-11 items-center justify-center bg-kc-ink px-6 text-sm tracking-wide text-kc-white"
            >
              Sign in
            </AppLink>
            <AppLink
              href="/register"
              className="flex min-h-11 items-center justify-center border border-kc-line px-6 text-sm tracking-wide text-kc-ink"
            >
              Create an account
            </AppLink>
          </div>
        </div>
      </Container>
    );
  }

  const displayName =
    (user.user_metadata?.["full_name"] as string | undefined) ?? user.email ?? "your account";

  return (
    <Container>
      <div className="py-10 lg:py-14">
        <h1 className="font-display text-[28px] leading-tight md:text-[40px]">My account</h1>
        <p className="mt-2 text-sm text-kc-muted">Signed in as {displayName}</p>

        <div className="mt-8 grid gap-8 lg:grid-cols-[220px_1fr] lg:gap-12">
          {/* Horizontally scrollable on mobile rather than stacked: four items
              wrapped onto four rows pushes the actual content off the screen. */}
          <nav aria-label="Account" className="-mx-4 overflow-x-auto px-4 lg:mx-0 lg:px-0">
            <ul className="flex gap-2 lg:flex-col lg:gap-1">
              {NAV.map((item) => {
                const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <li key={item.href} className="shrink-0">
                    <AppLink
                      href={item.href}
                      {...(active ? { "aria-current": "page" as const } : {})}
                      className={`flex min-h-11 items-center gap-3 whitespace-nowrap border px-4 text-sm transition-colors lg:border-0 lg:border-l-2 ${
                        active
                          ? "border-kc-ink bg-kc-ink text-kc-white lg:bg-transparent lg:text-kc-ink"
                          : "border-kc-line text-kc-charcoal hover:border-kc-ink lg:border-transparent"
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                      {item.label}
                    </AppLink>
                  </li>
                );
              })}
              <li className="shrink-0">
                <button
                  type="button"
                  onClick={() => void signOut()}
                  className="flex min-h-11 items-center gap-3 whitespace-nowrap border border-kc-line px-4 text-sm text-kc-charcoal transition-colors hover:border-kc-ink lg:border-0 lg:border-l-2 lg:border-transparent"
                >
                  <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
                  Sign out
                </button>
              </li>
            </ul>
          </nav>

          <div className="min-w-0">
            <Outlet />
          </div>
        </div>
      </div>
    </Container>
  );
}
