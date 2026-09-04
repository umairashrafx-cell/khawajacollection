/**
 * Order history. docs/BUILD-SPEC.pdf Section 11.6. noindex.
 *
 * Fetched in the browser rather than a loader, and this is the one place in
 * the app where Hard Rule 3 genuinely cannot apply: a loader runs on the
 * server, the access token lives in browser storage, so a loader has no way to
 * know who is asking. The data still comes from a server route
 * (/api/account/orders) which verifies the token before it reads anything —
 * what moved to the client is the question, not the authority to answer it.
 *
 * Guest orders do not appear here. An order placed while signed out has no
 * user_id, so it is found through /track-order with its number and phone.
 * That is said on the page rather than left as a mystery.
 */

import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PackageSearch } from "lucide-react";

import { AppLink } from "@/components/layout/AppLink";
import { OrderStatusBadge } from "@/components/account/OrderStatusSteps";
import { fetchOrders } from "@/lib/auth/account-api";
import { useUser } from "@/lib/auth/session-store";
import { formatDate, formatPKR } from "@/lib/format";

export const Route = createFileRoute("/account/orders/")({
  head: () => ({
    meta: [
      { title: "Your orders | Khawaja Collection" },
      { name: "description", content: "Orders placed with your account." },
      { name: "robots", content: "noindex, nofollow" },
    ],
    links: [{ rel: "canonical", href: "/account/orders" }],
  }),
  component: OrdersPage,
});

function OrdersPage() {
  const userId = useUser()?.id ?? null;

  const { data, isPending, error } = useQuery({
    queryKey: ["account-orders", userId],
    queryFn: fetchOrders,
    // Without this the query fires before the session has loaded and fails.
    enabled: userId !== null,
    // Order status changes on the warehouse's schedule, not the customer's.
    staleTime: 30_000,
  });

  return (
    <div>
      <h2 className="font-display text-xl">Orders</h2>

      {isPending ? <p className="mt-5 text-sm text-kc-muted">Loading your orders…</p> : null}

      {error ? (
        <p role="alert" className="mt-5 text-sm text-kc-sale">
          {error instanceof Error ? error.message : "We could not load your orders."}
        </p>
      ) : null}

      {data && data.length === 0 ? (
        <div className="mt-5 border border-kc-line bg-kc-white p-6">
          <PackageSearch className="h-5 w-5 text-kc-muted" aria-hidden="true" />
          <p className="mt-3 text-sm text-kc-charcoal">Nothing ordered with this account yet.</p>
          <p className="mt-2 text-xs text-kc-muted">
            Ordered as a guest? Find it on the{" "}
            <AppLink href="/track-order" className="underline underline-offset-4">
              tracking page
            </AppLink>{" "}
            with your order number and phone number.
          </p>
        </div>
      ) : null}

      {data && data.length > 0 ? (
        <ul className="mt-5 space-y-3">
          {data.map((order) => (
            <li key={order.orderNumber}>
              <AppLink
                href={`/account/orders/${order.orderNumber}`}
                className="flex flex-wrap items-center justify-between gap-4 border border-kc-line bg-kc-white p-5 transition-colors hover:border-kc-ink"
              >
                <span className="min-w-0">
                  <span className="kc-price block text-sm font-medium text-kc-ink">
                    {order.orderNumber}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-kc-muted">
                    {formatDate(order.createdAt)} · {order.itemCount}{" "}
                    {order.itemCount === 1 ? "piece" : "pieces"}
                    {order.firstItemName ? ` · ${order.firstItemName}` : ""}
                  </span>
                </span>
                <span className="flex items-center gap-4">
                  <OrderStatusBadge status={order.status} />
                  <span className="kc-price text-sm text-kc-ink">{formatPKR(order.total)}</span>
                </span>
              </AppLink>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
