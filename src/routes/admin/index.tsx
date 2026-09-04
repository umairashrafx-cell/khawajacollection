/**
 * Admin dashboard.
 *
 * BUILT AROUND "WHAT NEEDS DOING", NOT "HOW ARE WE DOING". A shop with a
 * handful of orders a day does not need a revenue chart; it needs to know that
 * three orders came in overnight and nobody has confirmed them. So the first
 * thing on the page is the count of orders sitting in `placed`, as a link
 * straight into that filter, and the vanity numbers come after.
 *
 * Cancelled orders are excluded from revenue — counting money that was never
 * taken is the fastest way to make a dashboard nobody trusts.
 */

import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, PackageCheck, PackageX, Wallet } from "lucide-react";

import { AppLink } from "@/components/layout/AppLink";
import { ORDER_STEPS } from "@/lib/order-steps";
import { fetchAdminOrders, fetchAdminProducts } from "@/lib/auth/admin-api";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import { formatDate, formatPKR } from "@/lib/format";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Admin | Khawaja Collection" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminDashboard,
});

function AdminDashboard() {
  // Server-authoritative, so these queries still fire for an admin whose
  // token predates the role. See src/hooks/useAdminAccess.ts.
  const { isAdmin } = useAdminAccess();

  const { data, isPending, error } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: () => fetchAdminOrders({}),
    enabled: isAdmin,
    // Someone leaves this open on a shop counter all day.
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  // Stock is the other thing that quietly costs money. It is a separate query
  // so a slow catalogue read never delays the order counts, which are the
  // reason anyone opens this page.
  const { data: stock } = useQuery({
    queryKey: ["admin-stock-summary"],
    queryFn: () => fetchAdminProducts({}),
    enabled: isAdmin,
    staleTime: 60_000,
  });

  if (isPending) return <p className="text-sm text-kc-muted">Loading…</p>;

  if (error) {
    return (
      <p role="alert" className="text-sm text-kc-sale">
        {error instanceof Error ? error.message : "Could not load the dashboard."}
      </p>
    );
  }

  const counts = data.counts;
  const needsAction = counts["placed"] ?? 0;
  const inFlight =
    (counts["confirmed"] ?? 0) +
    (counts["processing"] ?? 0) +
    (counts["shipped"] ?? 0) +
    (counts["out_for_delivery"] ?? 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl text-kc-ink">Today</h1>
        <p className="mt-1 text-sm text-kc-muted">
          {data.total} {data.total === 1 ? "order" : "orders"} in total
        </p>
      </div>

      {/* The one number that means "go and do something". */}
      <AppLink
        href="/admin/orders?status=placed"
        className={`flex items-center gap-4 border p-5 transition-colors ${
          needsAction > 0
            ? "border-kc-gold bg-kc-white hover:border-kc-ink"
            : "border-kc-line bg-kc-white"
        }`}
      >
        <PackageCheck
          className={`h-6 w-6 shrink-0 ${needsAction > 0 ? "text-kc-gold" : "text-kc-muted"}`}
          aria-hidden="true"
        />
        <span className="flex-1">
          <span className="block font-display text-3xl text-kc-ink">{needsAction}</span>
          <span className="block text-sm text-kc-charcoal">
            {needsAction === 0
              ? "Nothing waiting to be confirmed"
              : `${needsAction === 1 ? "order needs" : "orders need"} confirming`}
          </span>
        </span>
        {needsAction > 0 ? (
          <ArrowRight className="h-5 w-5 shrink-0 text-kc-muted" aria-hidden="true" />
        ) : null}
      </AppLink>

      {/* Sold-out pieces are invisible on the storefront, so nothing prompts
          anyone to notice. This is the only place that does. */}
      {stock && (stock.summary.soldOutVariants > 0 || stock.summary.lowStockVariants > 0) ? (
        <AppLink
          href={
            stock.summary.soldOutVariants > 0
              ? "/admin/products?filter=soldout"
              : "/admin/products?filter=low"
          }
          className="flex items-center gap-4 border border-kc-line bg-kc-white p-5 transition-colors hover:border-kc-ink"
        >
          <PackageX className="h-6 w-6 shrink-0 text-kc-sale" aria-hidden="true" />
          <span className="flex-1 text-sm text-kc-charcoal">
            <strong className="font-medium text-kc-ink">{stock.summary.soldOutVariants}</strong>{" "}
            {stock.summary.soldOutVariants === 1 ? "size cannot" : "sizes cannot"} be bought
            {stock.summary.lowStockVariants > 0 ? (
              <>
                {", and "}
                <strong className="font-medium text-kc-ink">
                  {stock.summary.lowStockVariants}
                </strong>{" "}
                {stock.summary.lowStockVariants === 1 ? "is" : "are"} down to{" "}
                {stock.summary.lowStockThreshold} or fewer
              </>
            ) : null}
            .
          </span>
          <ArrowRight className="h-5 w-5 shrink-0 text-kc-muted" aria-hidden="true" />
        </AppLink>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="border border-kc-line bg-kc-white p-5">
          <p className="kc-eyebrow text-kc-muted">In flight</p>
          <p className="mt-2 font-display text-2xl text-kc-ink">{inFlight}</p>
          <p className="mt-1 text-xs text-kc-muted">Confirmed through out for delivery</p>
        </div>
        <div className="border border-kc-line bg-kc-white p-5">
          <p className="kc-eyebrow text-kc-muted">
            <Wallet className="mr-1.5 inline h-3.5 w-3.5" aria-hidden="true" />
            Order value
          </p>
          <p className="kc-price mt-2 font-display text-2xl text-kc-ink">
            {formatPKR(data.revenue)}
          </p>
          <p className="mt-1 text-xs text-kc-muted">Every order except cancelled</p>
        </div>
      </div>

      <section>
        <h2 className="kc-eyebrow text-kc-muted">By status</h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {[...ORDER_STEPS, { status: "cancelled" as const, label: "Cancelled" }].map((step) => (
            <li key={step.status}>
              <AppLink
                href={`/admin/orders?status=${step.status}`}
                className="flex items-center justify-between border border-kc-line bg-kc-white px-4 py-3 text-sm transition-colors hover:border-kc-ink"
              >
                <span className="text-kc-charcoal">{step.label}</span>
                <span className="kc-price text-kc-ink">{counts[step.status] ?? 0}</span>
              </AppLink>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <div className="flex items-baseline justify-between">
          <h2 className="kc-eyebrow text-kc-muted">Latest orders</h2>
          <AppLink
            href="/admin/orders"
            className="text-xs text-kc-charcoal underline underline-offset-4 hover:text-kc-gold"
          >
            See all
          </AppLink>
        </div>

        {data.orders.length === 0 ? (
          <p className="mt-3 border border-kc-line bg-kc-white p-5 text-sm text-kc-charcoal">
            No orders yet. They will appear here the moment one is placed.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-kc-line border border-kc-line bg-kc-white">
            {data.orders.slice(0, 8).map((order) => (
              <li key={order.orderNumber}>
                <AppLink
                  href={`/admin/orders/${order.orderNumber}`}
                  className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3 text-sm transition-colors hover:bg-kc-sand"
                >
                  <span className="kc-price text-kc-ink">{order.orderNumber}</span>
                  <span className="text-xs text-kc-muted">{formatDate(order.createdAt)}</span>
                  <span className="kc-price ml-auto text-kc-ink">
                    {formatPKR(order.totals.total)}
                  </span>
                </AppLink>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
