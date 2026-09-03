/**
 * Free-delivery progress and the totals block. See docs/BUILD-SPEC.pdf
 * Sections 11.4 and 16.
 *
 * Guardrail 2 again: the flat shipping rate is a TODO in config, so the summary
 * says shipping is calculated at checkout rather than inventing a figure. It
 * shows a real number the moment `commerce.flatShippingRate` is set.
 */

import { commerce } from "@/config/site";
import { formatPKR } from "@/lib/format";

/** Section 16 — "PKR 1,200 away from free delivery". */
export function FreeDeliveryProgress({ subtotal }: { subtotal: number }) {
  const threshold = commerce.freeDeliveryThreshold;
  const remaining = Math.max(0, threshold - subtotal);
  const percent = Math.min(100, Math.round((subtotal / threshold) * 100));

  return (
    <div>
      <p className="text-xs text-kc-charcoal">
        {remaining === 0 ? (
          <>You have free delivery.</>
        ) : (
          <>
            <span className="kc-price font-medium">{formatPKR(remaining)}</span> away from free
            delivery.
          </>
        )}
      </p>
      <div
        className="mt-2 h-1 w-full bg-kc-line"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progress towards free delivery"
      >
        <div
          className="h-full bg-kc-ink transition-[width] duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

export function CartTotals({ subtotal }: { subtotal: number }) {
  const qualifies = subtotal >= commerce.freeDeliveryThreshold;
  const shipping = qualifies ? 0 : commerce.flatShippingRate;

  return (
    <dl className="space-y-2 text-sm">
      <div className="flex justify-between">
        <dt className="text-kc-charcoal">Subtotal</dt>
        <dd className="kc-price font-medium">{formatPKR(subtotal)}</dd>
      </div>
      <div className="flex justify-between">
        <dt className="text-kc-charcoal">Delivery</dt>
        <dd className="kc-price font-medium">
          {qualifies ? "Free" : shipping !== null ? formatPKR(shipping) : "Calculated at checkout"}
        </dd>
      </div>
      <div className="flex justify-between border-t border-kc-line pt-2 text-base">
        <dt className="font-medium">Total</dt>
        <dd className="kc-price font-semibold">
          {formatPKR(subtotal + (shipping ?? 0))}
          {shipping === null && !qualifies ? (
            <span className="ml-1 text-xs font-normal text-kc-muted">+ delivery</span>
          ) : null}
        </dd>
      </div>
    </dl>
  );
}
