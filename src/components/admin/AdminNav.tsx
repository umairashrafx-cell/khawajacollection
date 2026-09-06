/**
 * The admin bar.
 *
 * FOUR LABELLED DESTINATIONS DO NOT FIT A PHONE. Dashboard, Orders, Stock and
 * Categories come to roughly 400px of labels and icons against a 375px screen,
 * and the surrounding row only wraps at its own gaps — the nav itself was a
 * non-wrapping flex, so it pushed past the edge.
 *
 * Icons alone would fit and were rejected: a box, a clipboard, some crates and
 * a tree are not four distinguishable ideas to someone using this twice a
 * week. So the strip SCROLLS sideways on small screens instead, with the
 * labels kept. The negative margin lets it bleed to the screen edge, which is
 * what tells you there is more to the right.
 *
 * Extracted from admin.tsx so it can be rendered against fixtures and measured
 * at 375px. The layout it came from cannot be: it is behind an auth guard that
 * needs a real Supabase session.
 */

import { Boxes, ClipboardList, FolderTree, LayoutDashboard, LogOut, Store } from "lucide-react";

import { AppLink } from "@/components/layout/AppLink";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/orders", label: "Orders", icon: ClipboardList, exact: false },
  { href: "/admin/products", label: "Stock", icon: Boxes, exact: false },
  { href: "/admin/categories", label: "Categories", icon: FolderTree, exact: false },
] as const;

export function AdminNav({ pathname, onSignOut }: { pathname: string; onSignOut: () => void }) {
  return (
    <header className="bg-kc-ink text-kc-paper">
      <div className="mx-auto flex max-w-6xl items-center gap-x-4 px-4 py-3">
        <span className="shrink-0 font-display text-lg tracking-[0.16em]">
          KC<span className="text-kc-gold">.</span>
          <span className="ml-2 hidden align-middle text-[10px] uppercase tracking-[0.18em] text-kc-paper/60 sm:inline">
            Admin
          </span>
        </span>

        {/*
          The right-hand group is pinned and the nav is what scrolls, because
          "View shop" and "Sign out" must stay reachable without scrolling a
          strip to find them.
        */}
        <nav
          aria-label="Admin"
          className="-mx-2 flex flex-1 items-center gap-1 overflow-x-auto px-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {NAV.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <AppLink
                key={item.href}
                href={item.href}
                {...(active ? { "aria-current": "page" as const } : {})}
                className={`flex min-h-11 shrink-0 items-center gap-2 px-3 text-sm transition-colors ${
                  active ? "text-kc-paper" : "text-kc-paper/60 hover:text-kc-paper"
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {item.label}
              </AppLink>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-1">
          <AppLink
            href="/"
            className="flex min-h-11 items-center gap-2 px-2 text-sm text-kc-paper/60 transition-colors hover:text-kc-paper sm:px-3"
          >
            <Store className="h-4 w-4" aria-hidden="true" />
            <span className="hidden lg:inline">View shop</span>
          </AppLink>
          <button
            type="button"
            onClick={onSignOut}
            className="flex min-h-11 items-center gap-2 px-2 text-sm text-kc-paper/60 transition-colors hover:text-kc-paper sm:px-3"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            <span className="hidden lg:inline">Sign out</span>
          </button>
        </div>
      </div>
    </header>
  );
}
