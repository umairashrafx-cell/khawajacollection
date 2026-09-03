/**
 * Site header. See docs/BUILD-SPEC.pdf Sections 10.2 and 11.1.
 *
 * Sticky. Transparent over the hero on the homepage only, solid past 80px.
 * Hides on scroll down and reveals on scroll up, below `lg` only. Logo
 * centre-left, nav centre, actions right. Every link comes from
 * src/config/nav.ts — none is written in JSX.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Heart, Menu, Search, ShoppingBag, User } from "lucide-react";

import { accountNav, primaryNav } from "@/config/nav";
import { site } from "@/config/site";
import { useHeaderChrome } from "@/hooks/useHeaderChrome";
import { useCartCount, useCartHydrated } from "@/store/cart-store";
import { useWishlistCount } from "@/store/wishlist-store";
import { openOverlay } from "@/store/ui-store";
import MegaMenu from "./MegaMenu";
import MobileNav from "./MobileNav";
import { AppLink } from "./AppLink";

/** Section 10.2 — the panel opens on hover intent, not on the first pixel. */
const HOVER_INTENT_MS = 120;
const HOVER_CLOSE_MS = 180;

export default function Header() {
  const cartCount = useCartCount();
  const wishlistCount = useWishlistCount();
  const hydrated = useCartHydrated();
  const { solid, hidden } = useHeaderChrome();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const isHome = pathname === "/";

  const [openSection, setOpenSection] = useState<string | null>(null);
  const timer = useRef<number | null>(null);

  const clearTimer = useCallback(() => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  const scheduleOpen = useCallback(
    (label: string) => {
      clearTimer();
      timer.current = window.setTimeout(() => setOpenSection(label), HOVER_INTENT_MS);
    },
    [clearTimer],
  );

  const scheduleClose = useCallback(() => {
    clearTimer();
    timer.current = window.setTimeout(() => setOpenSection(null), HOVER_CLOSE_MS);
  }, [clearTimer]);

  useEffect(() => clearTimer, [clearTimer]);

  // Escape closes the panel wherever focus happens to be.
  useEffect(() => {
    if (openSection === null) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenSection(null);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [openSection]);

  // A route change must not leave a panel hanging open.
  useEffect(() => setOpenSection(null), [pathname]);

  const transparent = isHome && !solid && openSection === null;

  return (
    <>
      <header
        className={[
          // Tailwind v4 moves the translate utilities onto the `translate` property,
          // not `transform` — transitioning `transform` here would snap instead of slide.
          "sticky top-0 z-40 transition-[background-color,box-shadow,translate] duration-200",
          // The homepage hero starts underneath the header rather than below it.
          isHome ? "-mb-16" : "",
          // The hairline is a shadow, not a border, so the header box stays
          // exactly 64px and the homepage's -mb-16 lines up to the pixel.
          transparent ? "bg-transparent" : "bg-kc-paper shadow-[0_1px_0_0_var(--kc-line)]",
          // Hide-on-scroll is a mobile behaviour, so it stops at `lg`.
          hidden ? "max-lg:-translate-y-full" : "max-lg:translate-y-0",
        ].join(" ")}
        onMouseLeave={scheduleClose}
      >
        <div className="relative mx-auto flex h-16 max-w-[1440px] items-center px-4 md:px-6 lg:px-10">
          <button
            type="button"
            onClick={() => openOverlay("mobile-nav")}
            aria-label="Open menu"
            className="-ml-2 flex h-11 w-11 items-center justify-center lg:hidden"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>

          {/* Mobile centres the short mark: the full wordmark collides with the
              action icons at 360px, and Section 1.3 gives KC as the short mark. */}
          <Link
            to="/"
            aria-label={site.name}
            className="font-display text-lg tracking-[0.16em] max-lg:absolute max-lg:left-1/2 max-lg:-translate-x-1/2 lg:text-xl"
          >
            <span className="lg:hidden">{site.shortMark}</span>
            <span className="hidden lg:inline">{site.name.split(" ")[0]?.toUpperCase()}</span>
            <span className="text-kc-gold">.</span>
          </Link>

          <nav className="ml-10 hidden lg:block" aria-label="Categories">
            <ul className="flex items-center gap-7">
              {primaryNav.map((section) => (
                <li
                  key={section.href}
                  onMouseEnter={() =>
                    section.columns ? scheduleOpen(section.label) : scheduleClose()
                  }
                  onFocus={() => (section.columns ? setOpenSection(section.label) : undefined)}
                >
                  <AppLink
                    href={section.href}
                    aria-expanded={section.columns ? openSection === section.label : undefined}
                    className={[
                      "flex h-16 items-center border-b-2 text-[11px] font-medium uppercase tracking-[0.14em] transition-colors",
                      openSection === section.label
                        ? "border-kc-gold"
                        : "border-transparent hover:border-kc-gold",
                      section.isSale ? "text-kc-sale" : "text-kc-charcoal hover:text-kc-ink",
                    ].join(" ")}
                  >
                    {section.label}
                  </AppLink>

                  {openSection === section.label ? (
                    <MegaMenu section={section} onClose={() => setOpenSection(null)} />
                  ) : null}
                </li>
              ))}
            </ul>
          </nav>

          <div className="ml-auto flex items-center">
            <button
              type="button"
              onClick={() => openOverlay("search")}
              aria-label="Search"
              className="flex h-11 w-11 items-center justify-center"
            >
              <Search className="h-5 w-5" aria-hidden="true" />
            </button>

            <AppLink
              href={accountNav[0]?.href ?? "/account"}
              aria-label="My account"
              className="hidden h-11 w-11 items-center justify-center sm:flex"
            >
              <User className="h-5 w-5" aria-hidden="true" />
            </AppLink>

            <AppLink
              href="/wishlist"
              aria-label="Wishlist"
              className="relative flex h-11 w-11 items-center justify-center"
            >
              <Heart className="h-5 w-5" aria-hidden="true" />
              <CountBadge value={hydrated ? wishlistCount : 0} label="saved items" />
            </AppLink>

            <button
              type="button"
              onClick={() => openOverlay("cart")}
              aria-label="Shopping bag"
              className="relative -mr-2 flex h-11 w-11 items-center justify-center"
            >
              <ShoppingBag className="h-5 w-5" aria-hidden="true" />
              <CountBadge value={hydrated ? cartCount : 0} label="items in bag" />
            </button>
          </div>
        </div>
      </header>

      <MobileNav />
    </>
  );
}

/**
 * Counts render as 0 until the persisted stores have hydrated, so the server
 * and client markup match (Section 12) and nothing shifts when they load.
 */
function CountBadge({ value, label }: { value: number; label: string }) {
  if (value <= 0) return null;
  return (
    <span className="absolute right-1 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-kc-ink px-1 text-[10px] font-medium leading-none text-kc-paper">
      <span aria-hidden="true">{value}</span>
      <span className="sr-only">
        {value} {label}
      </span>
    </span>
  );
}
