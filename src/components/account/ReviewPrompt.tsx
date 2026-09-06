/**
 * "Happy with your order?" — the Google review ask.
 *
 * ONLY ON A DELIVERED ORDER, and that is the entire design. A review request
 * is a favour asked of someone who has the goods in their hands; asked any
 * earlier it is asking a customer to vouch for a parcel they are still waiting
 * for, which reads as pushy at best and gets a one-star answer at worst. This
 * is a cash-on-delivery shop, so "delivered" also means they have paid and
 * seen what they paid for — there is no better moment and no earlier one that
 * is honest.
 *
 * `delivered` is the last of the six steps in order-steps.ts. `cancelled` is
 * not on that sequence at all and is excluded by the same check: the last
 * thing a customer whose order fell through should see is a request to praise
 * the shop.
 *
 * NOT ON THE CONFIRMATION PAGE. That is the highest-traffic moment and the
 * obvious place to put it, which is why it is worth saying no explicitly: at
 * checkout the customer has a receipt and nothing else. The site already knows
 * when the parcel actually arrived, so it can wait.
 *
 * Renders nothing when `googleBusiness.reviewUrl` is unset — see the note in
 * site.ts on why that is silence rather than a "Placeholder:" badge.
 */

import { Star } from "lucide-react";

import { googleBusiness } from "@/config/site";
import type { OrderStatus } from "@/types";

export function ReviewPrompt({ status }: { status: OrderStatus }) {
  const { reviewUrl } = googleBusiness;
  if (!reviewUrl || status !== "delivered") return null;

  return (
    <section className="border border-kc-line bg-kc-sand p-5">
      <h3 className="text-sm font-medium text-kc-ink">Happy with your order?</h3>
      {/*
        The reason is local, not corporate. "It helps us" is about us; someone
        in Mandi Bahauddin finding a shop they can walk into is about them, and
        it happens to be exactly what a Google review does.
      */}
      <p className="mt-1 text-sm text-kc-charcoal">
        A short review helps other people nearby find the shop.
      </p>
      <a
        href={reviewUrl}
        target="_blank"
        rel="noreferrer noopener"
        className="mt-4 inline-flex min-h-11 items-center gap-2 border border-kc-ink px-5 text-[12px] font-medium uppercase tracking-[0.08em] text-kc-ink transition-colors hover:bg-kc-ink hover:text-kc-paper"
      >
        <Star className="h-4 w-4" aria-hidden="true" />
        Leave a review
        <span className="sr-only">on Google (opens in a new tab)</span>
      </a>
    </section>
  );
}
