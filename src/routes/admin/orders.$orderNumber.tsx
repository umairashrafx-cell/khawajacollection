/**
 * One order, and the controls to move it along.
 *
 * THE STATUS CONTROL IS THE WHOLE POINT OF THIS SCREEN, so it is designed
 * around what actually happens at a counter:
 *
 *   - The NEXT step is a single primary button. Confirming, packing and
 *     shipping happen in order, and 95% of the time the right action is "the
 *     next one". Making that one tap beats a dropdown every time.
 *   - Every other status is still reachable, because reality is not linear —
 *     a parcel comes back, a customer rings to cancel — but it sits behind a
 *     quieter control so it is never the accidental click.
 *   - Cancelling asks first. It is the only status that loses a sale, and
 *     the only one there is no undo for from the customer's point of view.
 *
 * The address block is selectable and laid out for copying onto a label,
 * which is what it is for.
 */

import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Check, Phone } from "lucide-react";

import { AppLink } from "@/components/layout/AppLink";
import { OrderStatusSteps } from "@/components/account/OrderStatusSteps";
import { ORDER_STEPS } from "@/lib/order-steps";
import { fetchAdminOrder, updateOrderStatus } from "@/lib/auth/admin-api";
import { useIsAdmin } from "@/lib/auth/session-store";
import { formatDate, formatPKR } from "@/lib/format";
import { paymentMethods } from "@/config/site";
import type { OrderStatus } from "@/types";

export const Route = createFileRoute("/admin/orders/$orderNumber")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.orderNumber} | Admin` },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminOrderDetail,
});

function nextStatus(current: OrderStatus): OrderStatus | null {
  if (current === "cancelled" || current === "delivered") return null;
  const index = ORDER_STEPS.findIndex((s) => s.status === current);
  return ORDER_STEPS[index + 1]?.status ?? null;
}

function AdminOrderDetail() {
  const { orderNumber } = Route.useParams();
  const isAdmin = useIsAdmin();
  const queryClient = useQueryClient();
  const [showAll, setShowAll] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    data: order,
    isPending,
    error: loadError,
  } = useQuery({
    queryKey: ["admin-order", orderNumber],
    queryFn: () => fetchAdminOrder(orderNumber),
    enabled: isAdmin,
  });

  const setStatus = useMutation({
    mutationFn: (status: OrderStatus) => updateOrderStatus(orderNumber, status),
    onSuccess: (updated) => {
      setError(null);
      queryClient.setQueryData(["admin-order", orderNumber], updated);
      // The list and the dashboard both show counts that just changed.
      void queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
    },
    onError: (e: Error) => setError(e.message),
  });

  if (isPending) return <p className="text-sm text-kc-muted">Loading…</p>;

  if (loadError || !order) {
    return (
      <div>
        <BackLink />
        <p role="alert" className="mt-4 text-sm text-kc-sale">
          {loadError instanceof Error ? loadError.message : "Order not found."}
        </p>
      </div>
    );
  }

  const next = nextStatus(order.status);
  const nextLabel = ORDER_STEPS.find((s) => s.status === next)?.label;
  const paymentLabel =
    paymentMethods.find((m) => m.id === order.paymentMethod)?.label ?? order.paymentMethod;

  return (
    <div>
      <BackLink />

      <header className="mt-4 flex flex-wrap items-baseline justify-between gap-3 border-b border-kc-line pb-4">
        <h1 className="kc-price font-display text-2xl text-kc-ink">{order.orderNumber}</h1>
        <p className="text-sm text-kc-muted">
          Placed {formatDate(order.createdAt)} · {paymentLabel} · {order.paymentStatus}
        </p>
      </header>

      {error ? (
        <p role="alert" className="mt-4 border border-kc-sale bg-kc-white p-3 text-sm text-kc-sale">
          {error}
        </p>
      ) : null}

      {/* --- The action --------------------------------------------------- */}
      <section className="mt-6 border border-kc-line bg-kc-white p-5">
        <h2 className="kc-eyebrow text-kc-muted">Status</h2>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          {next ? (
            <button
              type="button"
              disabled={setStatus.isPending}
              onClick={() => setStatus.mutate(next)}
              className="flex min-h-11 items-center gap-2 bg-kc-ink px-5 text-sm tracking-wide text-kc-paper transition-opacity disabled:opacity-60"
            >
              <Check className="h-4 w-4" aria-hidden="true" />
              {setStatus.isPending ? "Saving…" : `Mark ${nextLabel?.toLowerCase()}`}
            </button>
          ) : (
            <p className="text-sm text-kc-charcoal">
              {order.status === "delivered"
                ? "Delivered — nothing further to do."
                : "This order was cancelled."}
            </p>
          )}

          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            aria-expanded={showAll}
            className="min-h-11 text-sm text-kc-charcoal underline underline-offset-4 hover:text-kc-ink"
          >
            {showAll ? "Hide other statuses" : "Set another status"}
          </button>
        </div>

        {showAll ? (
          <ul className="mt-4 flex flex-wrap gap-2 border-t border-kc-line pt-4">
            {[...ORDER_STEPS.map((s) => s.status), "cancelled" as const].map((status) => {
              const isCurrent = status === order.status;
              const destructive = status === "cancelled";
              return (
                <li key={status}>
                  <button
                    type="button"
                    disabled={isCurrent || setStatus.isPending}
                    onClick={() => {
                      // The only status that loses a sale, and the only one a
                      // customer cannot undo. Worth one extra beat.
                      if (
                        destructive &&
                        !window.confirm(
                          `Cancel ${order.orderNumber}? The customer keeps the record.`,
                        )
                      ) {
                        return;
                      }
                      setStatus.mutate(status);
                    }}
                    className={`flex min-h-11 items-center border px-3 text-sm transition-colors ${
                      isCurrent
                        ? "cursor-default border-kc-ink bg-kc-ink text-kc-paper"
                        : destructive
                          ? "border-kc-sale text-kc-sale hover:bg-kc-sale hover:text-kc-paper"
                          : "border-kc-line text-kc-charcoal hover:border-kc-ink"
                    }`}
                  >
                    {ORDER_STEPS.find((s) => s.status === status)?.label ?? "Cancelled"}
                    {isCurrent ? <span className="sr-only"> — current</span> : null}
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}

        <div className="mt-6 border-t border-kc-line pt-5">
          <OrderStatusSteps status={order.status} />
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* --- Ship to ---------------------------------------------------- */}
        <section className="border border-kc-line bg-kc-white p-5">
          <h2 className="kc-eyebrow text-kc-muted">Ship to</h2>
          {/* Laid out for copying onto a label. */}
          <address className="mt-3 select-text text-sm not-italic leading-relaxed text-kc-ink">
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

          <p className="mt-4">
            <a
              href={`tel:${order.phone}`}
              className="kc-price inline-flex min-h-11 items-center gap-2 text-sm text-kc-ink underline-offset-4 hover:underline"
            >
              <Phone className="h-4 w-4" aria-hidden="true" />
              {order.phone}
            </a>
          </p>
          {order.email ? (
            <p>
              <a
                href={`mailto:${order.email}`}
                className="inline-flex min-h-11 items-center text-sm text-kc-charcoal underline-offset-4 hover:underline"
              >
                {order.email}
              </a>
            </p>
          ) : null}

          {order.shipping.notes ? (
            <div className="mt-4 border-t border-kc-line pt-3">
              <p className="kc-eyebrow text-kc-muted">Delivery note</p>
              <p className="mt-1 text-sm text-kc-charcoal">{order.shipping.notes}</p>
            </div>
          ) : null}
        </section>

        {/* --- What to pack ----------------------------------------------- */}
        <section className="border border-kc-line bg-kc-white p-5">
          <h2 className="kc-eyebrow text-kc-muted">Items</h2>
          <ul className="mt-3 divide-y divide-kc-line border-y border-kc-line">
            {order.items.map((item) => (
              <li
                key={`${item.slug}-${item.size}-${item.colorName}`}
                className="flex justify-between gap-4 py-3 text-sm"
              >
                <span className="min-w-0">
                  <span className="block text-kc-ink">{item.name}</span>
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
            <div className="flex justify-between border-t border-kc-line pt-2 font-medium text-kc-ink">
              <dt>Total</dt>
              <dd className="kc-price">{formatPKR(order.totals.total)}</dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  );
}

function BackLink() {
  return (
    <AppLink
      href="/admin/orders"
      className="inline-flex min-h-11 items-center gap-2 text-sm text-kc-charcoal underline-offset-4 hover:underline"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      All orders
    </AppLink>
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
