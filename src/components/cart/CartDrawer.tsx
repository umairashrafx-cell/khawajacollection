/**
 * Cart drawer. See docs/BUILD-SPEC.pdf Sections 10.2 and 11.4.
 *
 * "Right sheet, 420px desktop / full-width mobile. Free-delivery progress bar
 * at top. Empty state with a category CTA." The drawer is the primary cart
 * surface; /cart is the same data in a full-page layout.
 *
 * Dynamically imported by the root layout (Phase 6 requirement), so its weight
 * and Sonner's stay out of the first load.
 */

import { useCallback } from "react";
import { X } from "lucide-react";

import { AppLink } from "@/components/layout/AppLink";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { useCartHydrated, useCartLines, useCartSubtotal } from "@/store/cart-store";
import { closeOverlay, useIsOverlayOpen } from "@/store/ui-store";
import { CartItem } from "./CartItem";
import { CartTotals, FreeDeliveryProgress } from "./CartSummary";

export default function CartDrawer() {
  const open = useIsOverlayOpen("cart");
  const lines = useCartLines();
  const subtotal = useCartSubtotal();
  const hydrated = useCartHydrated();
  const close = useCallback(() => closeOverlay(), []);
  const panelRef = useFocusTrap<HTMLDivElement>(open, close);
  useBodyScrollLock(open);

  if (!open) return null;

  const count = lines.reduce((n, line) => n + line.quantity, 0);

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close bag"
        onClick={close}
        className="absolute inset-0 bg-kc-ink/40"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping bag"
        tabIndex={-1}
        className="absolute inset-y-0 right-0 flex w-full flex-col bg-kc-paper sm:w-[420px]"
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-kc-line px-5">
          <h2 className="font-display text-lg">
            Your bag{hydrated && count > 0 ? ` (${count})` : ""}
          </h2>
          <button
            type="button"
            onClick={close}
            aria-label="Close bag"
            className="-mr-2 flex h-11 w-11 items-center justify-center"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {hydrated && lines.length > 0 ? (
          <>
            <div className="shrink-0 border-b border-kc-line px-5 py-4">
              <FreeDeliveryProgress subtotal={subtotal} />
            </div>

            <ul className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
              {lines.map((line) => (
                <li key={`${line.productId}:${line.variantId}`}>
                  <CartItem line={line} compact />
                </li>
              ))}
            </ul>

            <div className="shrink-0 space-y-3 border-t border-kc-line px-5 py-4">
              <CartTotals subtotal={subtotal} />
              <AppLink
                href="/cart"
                onClick={close}
                className="flex min-h-11 w-full items-center justify-center border border-kc-ink text-[12px] font-medium uppercase tracking-[0.08em] text-kc-ink"
              >
                View bag
              </AppLink>
              <AppLink
                href="/checkout"
                onClick={close}
                className="flex min-h-12 w-full items-center justify-center bg-kc-ink text-[12px] font-medium uppercase tracking-[0.08em] text-kc-paper"
              >
                Checkout
              </AppLink>
            </div>
          </>
        ) : (
          <EmptyBag onClose={close} />
        )}
      </div>
    </div>
  );
}

/** Section 11.4 — empty state with a category CTA. */
function EmptyBag({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
      <h3 className="font-display text-xl text-kc-ink">Your bag is empty</h3>
      <p className="mt-3 max-w-xs text-sm text-kc-charcoal">
        Nothing saved yet. Start with the new season, or browse what is on sale.
      </p>
      <div className="mt-7 flex w-full max-w-xs flex-col gap-3">
        <AppLink
          href="/new-arrivals"
          onClick={onClose}
          className="flex min-h-11 items-center justify-center bg-kc-ink text-[12px] font-medium uppercase tracking-[0.08em] text-kc-paper"
        >
          Shop new in
        </AppLink>
        <AppLink
          href="/sale"
          onClick={onClose}
          className="flex min-h-11 items-center justify-center border border-kc-ink text-[12px] font-medium uppercase tracking-[0.08em] text-kc-ink"
        >
          Shop sale
        </AppLink>
      </div>
    </div>
  );
}
