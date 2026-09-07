/**
 * Google Analytics events.
 *
 * ONE PLACE THAT KNOWS `window.gtag` EXISTS. The tag is injected in
 * `__root.tsx` and only in production builds, so on a dev server, in a test,
 * during SSR, and for any visitor running a content blocker, `gtag` is simply
 * not there. Every call here no-ops in that case rather than throwing — an
 * analytics failure must never be able to break a checkout, which is the one
 * page on this site where an exception costs real money.
 */

import { site } from "@/config/site";

declare global {
  interface Window {
    gtag?: (command: string, ...args: unknown[]) => void;
  }
}

function gtag(command: string, ...args: unknown[]): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  try {
    window.gtag(command, ...args);
  } catch {
    // Deliberately swallowed. See the note above: the caller is a checkout.
  }
}

export interface PurchaseItem {
  productId: string;
  name: string;
  size: string;
  colorName: string;
  unitPrice: number;
  quantity: number;
}

/**
 * GA4 ecommerce `purchase`. This is the event Google Ads imports to answer the
 * only question that matters about a campaign: did the clicks earn anything.
 *
 * `value` IS THE SERVER'S TOTAL, not the cart's. `/api/orders` already returns
 * `order.totals.total` — the figure it recomputed from the repository when it
 * priced the order (Guardrail 5) and wrote to the row — and that is what is
 * reported. The cart's subtotal is a preview that excludes shipping and is
 * computed from prices the browser was holding; reporting it would make every
 * campaign look less profitable than it is, and quietly.
 *
 * The per-item prices below ARE the cart's, because they are what the customer
 * saw on the page. GA4 does not require the items to sum to `value`, and they
 * will not: `value` includes delivery.
 *
 * `transaction_id` is the order number, which is what makes the event
 * idempotent — Google discards a repeat of one it has already recorded, so a
 * customer refreshing or a retry cannot inflate the numbers.
 */
export function trackPurchase(input: {
  orderNumber: string;
  total: number;
  items: PurchaseItem[];
}): void {
  gtag("event", "purchase", {
    transaction_id: input.orderNumber,
    value: input.total,
    currency: site.currency,
    items: input.items.map((item, index) => ({
      item_id: item.productId,
      item_name: item.name,
      item_variant: [item.colorName, item.size].filter(Boolean).join(" / "),
      price: item.unitPrice,
      quantity: item.quantity,
      index,
    })),
  });
}
