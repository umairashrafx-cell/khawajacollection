/**
 * The six-step order timeline. docs/BUILD-SPEC.pdf Section 11.6.
 *
 * Shared by /track-order and the account order detail because two copies of
 * "what are the steps and which one are we on" is the same failure mode as two
 * copies of facet counting: they agree until someone edits one of them, and
 * then a customer sees a different status depending on which page they opened.
 *
 * `cancelled` deliberately sits outside the sequence rather than being a
 * seventh step — it is not further along, it is off the path.
 */

import { Check } from "lucide-react";

import { ORDER_STEPS } from "@/lib/order-steps";
import type { OrderStatus } from "@/types";

export function OrderStatusSteps({ status }: { status: OrderStatus }) {
  if (status === "cancelled") {
    return <p className="text-sm text-kc-sale">This order was cancelled.</p>;
  }

  const currentIndex = ORDER_STEPS.findIndex((step) => step.status === status);

  return (
    <ol className="space-y-0">
      {ORDER_STEPS.map((step, index) => {
        const done = index <= currentIndex;
        const isCurrent = index === currentIndex;
        const isLast = index === ORDER_STEPS.length - 1;

        return (
          <li key={step.status} className="flex gap-4">
            <div className="flex flex-col items-center">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${
                  done ? "border-kc-ink bg-kc-ink" : "border-kc-line bg-kc-white"
                }`}
              >
                {done ? <Check className="h-3.5 w-3.5 text-kc-paper" aria-hidden="true" /> : null}
              </span>
              {!isLast ? (
                <span
                  className={`w-px flex-1 ${index < currentIndex ? "bg-kc-ink" : "bg-kc-line"}`}
                />
              ) : null}
            </div>

            <div className={isLast ? "pb-0" : "pb-6"}>
              <p
                className={`text-sm font-medium ${done ? "text-kc-ink" : "text-kc-muted"}`}
                aria-current={isCurrent ? "step" : undefined}
              >
                {step.label}
                {/* The tick marks are decorative; without this a screen reader
                    hears six labels and no indication of where the order is. */}
                {isCurrent ? <span className="sr-only"> — current status</span> : null}
              </p>
              <p className="mt-0.5 text-xs text-kc-muted">{step.description}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/** The compact form, for a list of orders where a full timeline would not fit. */
export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const step = ORDER_STEPS.find((candidate) => candidate.status === status);
  const label = status === "cancelled" ? "Cancelled" : (step?.label ?? "Placed");
  const done = status === "delivered";

  return (
    <span
      className={`inline-flex items-center whitespace-nowrap border px-2.5 py-1 text-xs ${
        status === "cancelled"
          ? "border-kc-sale text-kc-sale"
          : done
            ? "border-kc-ink bg-kc-ink text-kc-paper"
            : "border-kc-line text-kc-charcoal"
      }`}
    >
      {label}
    </span>
  );
}
