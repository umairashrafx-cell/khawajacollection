/**
 * One order, as a card, for phones.
 *
 * WHY NOT JUST LET THE TABLE SCROLL. It already did. The orders table is
 * `min-w-[42rem]` inside `overflow-x-auto`, which on a 375px phone means the
 * total and the way into the order are both off the right-hand edge — you have
 * to discover that the thing scrolls, then scroll it, to find out what an
 * order is worth. Nothing overflowed the page, so it looked fine in a
 * screenshot and was useless in a hand.
 *
 * Hard Rule 8: the mobile layout is designed separately, not scaled down. So
 * the card is not the table reflowed — it is ordered by what you want on a
 * phone. The order number and the total come first, because the two questions
 * are "which one" and "how much". The phone number is a `tel:` link, because
 * on the device this layout exists for, the next action after reading an order
 * is usually to ring the customer about it.
 *
 * A SEPARATE COMPONENT, not a block of JSX inside the route, so it can be
 * rendered against fixtures and checked at 375px. The route's own component
 * cannot: it calls `Route.useSearch()`, which throws outside its real match.
 */

import { ChevronRight } from "lucide-react";

import { AppLink } from "@/components/layout/AppLink";
import { OrderStatusBadge } from "@/components/account/OrderStatusSteps";
import { formatPKR } from "@/lib/format";
import type { AdminOrder } from "@/lib/auth/admin-api";

export function OrderCard({ order, placedAt }: { order: AdminOrder; placedAt: string }) {
  return (
    <li className="border border-kc-line bg-kc-white">
      <AppLink
        href={`/admin/orders/${order.orderNumber}`}
        className="flex items-baseline justify-between gap-3 border-b border-kc-line px-4 py-3"
      >
        <span className="kc-price font-medium text-kc-ink underline underline-offset-4 decoration-kc-muted">
          {order.orderNumber}
        </span>
        <span className="kc-price whitespace-nowrap text-sm text-kc-ink">
          {formatPKR(order.totals.total)}
        </span>
      </AppLink>

      <div className="space-y-2 px-4 py-3">
        <p className="text-sm text-kc-ink">{order.shipping.name}</p>
        {/*
          Outside the card's own link. A nested anchor is invalid HTML and the
          browser resolves it by dropping one of them, so "ring the customer"
          would silently become "open the order".
        */}
        <a
          href={`tel:${order.phone}`}
          className="kc-price inline-flex min-h-11 items-center text-sm text-kc-charcoal underline underline-offset-4"
        >
          {order.phone}
        </a>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <OrderStatusBadge status={order.status} />
          <span className="text-xs text-kc-muted">{placedAt}</span>
        </div>
      </div>

      <AppLink
        href={`/admin/orders/${order.orderNumber}`}
        className="flex min-h-11 items-center justify-center gap-1 border-t border-kc-line text-sm text-kc-charcoal"
      >
        Open<span className="sr-only"> order {order.orderNumber}</span>
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </AppLink>
    </li>
  );
}
