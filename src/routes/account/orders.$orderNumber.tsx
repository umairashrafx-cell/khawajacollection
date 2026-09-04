/**
 * One order, in full. docs/BUILD-SPEC.pdf Section 11.6 ("order detail").
 * noindex.
 *
 * The lookup is scoped to the signed-in user server-side, so an order number
 * belonging to someone else returns exactly what a made-up one does: not
 * found. Nothing on this page distinguishes the two cases, deliberately —
 * "this order exists but is not yours" is an answer worth nothing to the
 * customer and a great deal to someone iterating order numbers.
 */

import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { AppLink } from "@/components/layout/AppLink";
import { OrderStatusSteps } from "@/components/account/OrderStatusSteps";
import { fetchOrder } from "@/lib/auth/account-api";
import { useUser } from "@/lib/auth/session-store";
import { formatDate, formatPKR } from "@/lib/format";
import { paymentMethods } from "@/config/site";

export const Route = createFileRoute("/account/orders/$orderNumber")({
  head: ({ params }) => ({
    meta: [
      { title: `Order ${params.orderNumber} | Khawaja Collection` },
      { name: "description", content: "Your order details." },
      { name: "robots", content: "noindex, nofollow" },
    ],
    links: [{ rel: "canonical", href: `/account/orders/${params.orderNumber}` }],
  }),
  component: OrderDetailPage,
});

function OrderDetailPage() {
  const { orderNumber } = Route.useParams();
  const userId = useUser()?.id ?? null;

  const {
    data: order,
    isPending,
    error,
  } = useQuery({
    queryKey: ["account-order", userId, orderNumber],
    queryFn: () => fetchOrder(orderNumber),
    enabled: userId !== null,
    staleTime: 30_000,
  });

  const paymentLabel =
    paymentMethods.find((method) => method.id === order?.paymentMethod)?.label ??
    order?.paymentMethod ??
    "";

  return (
    <div>
      <p className="text-sm">
        <AppLink href="/account/orders" className="underline underline-offset-4 hover:text-kc-gold">
          ← All orders
        </AppLink>
      </p>

      {isPending ? <p className="mt-5 text-sm text-kc-muted">Loading…</p> : null}

      {error ? (
        <p role="alert" className="mt-5 text-sm text-kc-sale">
          {error instanceof Error ? error.message : "We could not find that order."}
        </p>
      ) : null}

      {order ? (
        <div className="mt-5 space-y-8">
          <header className="flex flex-wrap items-baseline justify-between gap-2 border-b border-kc-line pb-4">
            <h2 className="kc-price font-display text-xl">{order.orderNumber}</h2>
            <p className="text-xs text-kc-muted">
              Placed {formatDate(order.createdAt)} · {paymentLabel}
            </p>
          </header>

          <section>
            <h3 className="kc-eyebrow text-kc-muted">Progress</h3>
            <div className="mt-4">
              <OrderStatusSteps status={order.status} />
            </div>
          </section>

          <section>
            <h3 className="kc-eyebrow text-kc-muted">Items</h3>
            <ul className="mt-3 divide-y divide-kc-line border-y border-kc-line">
              {order.items.map((item) => (
                <li
                  key={`${item.slug}-${item.size}-${item.colorName}`}
                  className="flex justify-between gap-4 py-3 text-sm"
                >
                  <span className="min-w-0">
                    {/* A delisted product has no slug (see the order repository),
                        so the name renders as plain text rather than a dead link. */}
                    {item.slug ? (
                      <AppLink
                        href={`/products/${item.slug}`}
                        className="block truncate text-kc-ink underline-offset-4 hover:underline"
                      >
                        {item.name}
                      </AppLink>
                    ) : (
                      <span className="block truncate text-kc-ink">{item.name}</span>
                    )}
                    <span className="text-xs text-kc-muted">
                      {item.colorName} · {item.size} · Qty {item.quantity}
                    </span>
                  </span>
                  <span className="kc-price shrink-0 text-kc-ink">
                    {formatPKR(item.unitPrice * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>

            <dl className="mt-4 space-y-1.5 text-sm">
              <Row label="Subtotal" value={formatPKR(order.totals.subtotal)} />
              <Row
                label="Delivery"
                value={order.totals.shipping === 0 ? "Free" : formatPKR(order.totals.shipping)}
              />
              {order.totals.discount > 0 ? (
                <Row label="Discount" value={`−${formatPKR(order.totals.discount)}`} />
              ) : null}
              <div className="flex justify-between border-t border-kc-line pt-2 font-medium">
                <dt>Total</dt>
                <dd className="kc-price">{formatPKR(order.totals.total)}</dd>
              </div>
            </dl>
          </section>

          <section>
            <h3 className="kc-eyebrow text-kc-muted">Delivered to</h3>
            <address className="mt-3 text-sm not-italic text-kc-charcoal">
              {order.shipping.name}
              <br />
              {order.shipping.line1}
              {order.shipping.line2 ? (
                <>
                  <br />
                  {order.shipping.line2}
                </>
              ) : null}
              <br />
              {order.shipping.city}, {order.shipping.province}
              {order.shipping.postalCode ? ` ${order.shipping.postalCode}` : ""}
            </address>
            {order.shipping.notes ? (
              <p className="mt-2 text-xs text-kc-muted">Notes: {order.shipping.notes}</p>
            ) : null}
          </section>
        </div>
      ) : null}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-kc-charcoal">
      <dt>{label}</dt>
      <dd className="kc-price">{value}</dd>
    </div>
  );
}
