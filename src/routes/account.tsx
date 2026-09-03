/**
 * Account. See docs/BUILD-SPEC.pdf Sections 7 and 11.6.
 *
 * Accounts need Supabase Auth, which is Phase 8. Until then this page is
 * honest about what exists rather than pretending: the wishlist is real and
 * lives on this device, and orders are found through tracking.
 *
 * It deliberately shows no order history. Order data is server-side only and
 * requires an order number plus a matching contact (Section 11.6) — listing
 * orders to an unauthenticated visitor is exactly what Section 8.3 forbids.
 *
 * noindex per Section 7.
 */

import { createFileRoute } from "@tanstack/react-router";
import { Heart, PackageSearch } from "lucide-react";

import { AppLink } from "@/components/layout/AppLink";
import { Container } from "@/components/layout/Container";
import { useWishlistCount, useWishlistHydrated } from "@/store/wishlist-store";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "My Account | Khawaja Collection" },
      {
        name: "description",
        content: "Your saved pieces and order tracking at Khawaja Collection.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
    links: [{ rel: "canonical", href: "/account" }],
  }),
  component: AccountPage,
});

function AccountPage() {
  const savedCount = useWishlistCount();
  const hydrated = useWishlistHydrated();

  return (
    <Container>
      <div className="mx-auto max-w-2xl py-10 lg:py-14">
        <h1 className="font-display text-[28px] leading-tight md:text-[40px]">My account</h1>
        <p className="mt-3 text-sm text-kc-charcoal">
          Sign-in is not open yet. Your wishlist is saved on this device, and any order can be
          followed with its order number.
        </p>

        <ul className="mt-10 space-y-4">
          <li>
            <AppLink
              href="/wishlist"
              className="flex items-center gap-4 border border-kc-line bg-kc-white p-5 transition-colors hover:border-kc-ink"
            >
              <Heart className="h-5 w-5 shrink-0 text-kc-muted" aria-hidden="true" />
              <span className="flex-1">
                <span className="block text-sm font-medium text-kc-ink">Wishlist</span>
                <span className="block text-xs text-kc-muted">
                  {hydrated
                    ? savedCount === 0
                      ? "Nothing saved yet"
                      : `${savedCount} ${savedCount === 1 ? "piece" : "pieces"} saved on this device`
                    : "Saved on this device"}
                </span>
              </span>
            </AppLink>
          </li>
          <li>
            <AppLink
              href="/track-order"
              className="flex items-center gap-4 border border-kc-line bg-kc-white p-5 transition-colors hover:border-kc-ink"
            >
              <PackageSearch className="h-5 w-5 shrink-0 text-kc-muted" aria-hidden="true" />
              <span className="flex-1">
                <span className="block text-sm font-medium text-kc-ink">Track an order</span>
                <span className="block text-xs text-kc-muted">
                  Order number plus the phone number on the order
                </span>
              </span>
            </AppLink>
          </li>
        </ul>
      </div>
    </Container>
  );
}
