/**
 * Full cart page. See docs/BUILD-SPEC.pdf Sections 7 and 11.4.
 *
 * "The drawer is the primary surface; /cart is the same data in a full-page
 * layout." Both read the same store and share CartItem and the summary block,
 * so they cannot drift apart.
 *
 * noindex per Section 7 — a personal bag has nothing to offer a search engine.
 */

import { createFileRoute } from "@tanstack/react-router";

import { AppLink } from "@/components/layout/AppLink";
import { CartItem } from "@/components/cart/CartItem";
import { CartTotals, FreeDeliveryProgress } from "@/components/cart/CartSummary";
import { Container } from "@/components/layout/Container";
import { useCartHydrated, useCartLines, useCartSubtotal } from "@/store/cart-store";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your Bag | Khawaja Collection" },
      { name: "description", content: "Review the pieces in your bag before checking out." },
      { name: "robots", content: "noindex, nofollow" },
    ],
    links: [{ rel: "canonical", href: "/cart" }],
  }),
  component: CartPage,
});

function CartPage() {
  const lines = useCartLines();
  const subtotal = useCartSubtotal();
  const hydrated = useCartHydrated();

  return (
    <Container>
      <div className="py-10 lg:py-14">
        <h1 className="font-display text-[28px] leading-tight md:text-[40px]">Your bag</h1>

        {!hydrated ? (
          // The bag lives in localStorage, so the server cannot know it. Hold a
          // stable placeholder rather than flashing "empty" then filling in.
          <p className="mt-8 text-sm text-kc-muted">Loading your bag…</p>
        ) : lines.length === 0 ? (
          <EmptyCart />
        ) : (
          <div className="mt-8 gap-12 lg:flex">
            <div className="min-w-0 flex-1">
              <ul className="space-y-8">
                {lines.map((line) => (
                  <li
                    key={`${line.productId}:${line.variantId}`}
                    className="border-b border-kc-line pb-8 last:border-0"
                  >
                    <CartItem line={line} />
                  </li>
                ))}
              </ul>
            </div>

            <aside className="mt-10 lg:mt-0 lg:w-[360px] lg:shrink-0">
              <div className="border border-kc-line bg-kc-white p-6 lg:sticky lg:top-24">
                <h2 className="font-display text-lg">Summary</h2>
                <div className="mt-4">
                  <FreeDeliveryProgress subtotal={subtotal} />
                </div>
                <div className="mt-6">
                  <CartTotals subtotal={subtotal} />
                </div>
                <AppLink
                  href="/checkout"
                  className="mt-6 flex min-h-12 w-full items-center justify-center bg-kc-ink text-[12px] font-medium uppercase tracking-[0.08em] text-kc-paper transition-colors hover:bg-kc-charcoal"
                >
                  Checkout
                </AppLink>
                <p className="mt-3 text-center text-xs text-kc-muted">
                  Cash on delivery available across Pakistan.
                </p>
              </div>
            </aside>
          </div>
        )}
      </div>
    </Container>
  );
}

function EmptyCart() {
  return (
    <div className="mt-10 border border-kc-line bg-kc-white px-6 py-16 text-center">
      <h2 className="font-display text-xl text-kc-ink">Your bag is empty</h2>
      <p className="mx-auto mt-3 max-w-sm text-sm text-kc-charcoal">
        Nothing saved yet. Start with the new season, or browse what is on sale.
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <AppLink
          href="/new-arrivals"
          className="flex min-h-11 items-center justify-center bg-kc-ink px-7 text-[12px] font-medium uppercase tracking-[0.08em] text-kc-paper"
        >
          Shop new in
        </AppLink>
        <AppLink
          href="/sale"
          className="flex min-h-11 items-center justify-center border border-kc-ink px-7 text-[12px] font-medium uppercase tracking-[0.08em] text-kc-ink"
        >
          Shop sale
        </AppLink>
      </div>
    </div>
  );
}
