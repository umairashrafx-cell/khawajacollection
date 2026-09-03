/**
 * Order tracking. See docs/BUILD-SPEC.pdf Section 11.6.
 *
 * "Order number + phone or email. Server-side lookup only. Six-step visual
 * timeline. Never expose order data from a client query."
 *
 * This page holds no order data of its own — it posts both details to
 * /api/track-order and renders whatever that returns. There is no client
 * query against the catalogue or the order store anywhere on it.
 */

import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Check } from "lucide-react";

import { Container } from "@/components/layout/Container";
import { formatDate, formatPKR } from "@/lib/format";
import type { OrderStatus, OrderTotals } from "@/types";

export const Route = createFileRoute("/track-order")({
  head: () => ({
    meta: [
      { title: "Track Your Order | Khawaja Collection" },
      {
        name: "description",
        content:
          "Follow your Khawaja Collection order from our studio to your door. Enter your order number and the phone number on the order.",
      },
    ],
    links: [{ rel: "canonical", href: "/track-order" }],
  }),
  component: TrackOrderPage,
});

/** Section 11.6 — the six steps, in order. `cancelled` sits outside them. */
const STEPS: { status: OrderStatus; label: string; description: string }[] = [
  { status: "placed", label: "Placed", description: "We have your order." },
  { status: "confirmed", label: "Confirmed", description: "Stock checked and reserved." },
  { status: "processing", label: "Processing", description: "Being packed in the studio." },
  { status: "shipped", label: "Shipped", description: "Handed to the courier." },
  { status: "out_for_delivery", label: "Out for delivery", description: "With you today." },
  { status: "delivered", label: "Delivered", description: "Received. Thank you." },
];

interface TrackedOrder {
  orderNumber: string;
  status: OrderStatus;
  createdAt: string;
  city: string;
  items: {
    name: string;
    slug: string;
    size: string;
    colorName: string;
    quantity: number;
    unitPrice: number;
  }[];
  totals: OrderTotals;
}

function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [contactValue, setContactValue] = useState("");
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setOrder(null);

    try {
      const response = await fetch("/api/track-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber, contact: contactValue }),
      });
      const result = (await response.json()) as {
        ok?: boolean;
        error?: string;
        order?: TrackedOrder;
      };

      if (!response.ok || !result.ok || !result.order) {
        setError(result.error ?? "We could not find that order.");
        return;
      }
      setOrder(result.order);
    } catch {
      setError("We could not reach the server. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Container>
      <div className="mx-auto max-w-2xl py-10 lg:py-14">
        <h1 className="font-display text-[28px] leading-tight md:text-[40px]">Track your order</h1>
        <p className="mt-3 text-sm text-kc-charcoal">
          Enter your order number and the phone number or email on the order.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4" noValidate>
          <div>
            <label htmlFor="order-number" className="block text-sm text-kc-charcoal">
              Order number
            </label>
            <input
              id="order-number"
              value={orderNumber}
              onChange={(event) => setOrderNumber(event.target.value)}
              placeholder="KC-2026-00042"
              className="mt-1.5 min-h-11 w-full border border-kc-line bg-kc-white px-3 text-sm"
            />
          </div>
          <div>
            <label htmlFor="order-contact" className="block text-sm text-kc-charcoal">
              Phone number or email
            </label>
            <input
              id="order-contact"
              value={contactValue}
              onChange={(event) => setContactValue(event.target.value)}
              placeholder="0300 1234567"
              className="mt-1.5 min-h-11 w-full border border-kc-line bg-kc-white px-3 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="min-h-12 w-full bg-kc-ink text-[12px] font-medium uppercase tracking-[0.08em] text-kc-paper disabled:bg-kc-muted sm:w-auto sm:px-10"
          >
            {loading ? "Looking…" : "Track order"}
          </button>
        </form>

        <p role="status" aria-live="polite" className="mt-4 min-h-5 text-sm text-kc-sale">
          {error}
        </p>

        {order ? <Timeline order={order} /> : null}
      </div>
    </Container>
  );
}

function Timeline({ order }: { order: TrackedOrder }) {
  const currentIndex = STEPS.findIndex((step) => step.status === order.status);
  const cancelled = order.status === "cancelled";

  return (
    <section className="mt-10 border border-kc-line bg-kc-white p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-kc-line pb-4">
        <h2 className="kc-price font-display text-xl">{order.orderNumber}</h2>
        <p className="text-xs text-kc-muted">
          Placed {formatDate(order.createdAt)} · {order.city}
        </p>
      </div>

      {cancelled ? (
        <p className="mt-6 text-sm text-kc-sale">This order was cancelled.</p>
      ) : (
        <ol className="mt-6 space-y-0">
          {STEPS.map((step, index) => {
            const done = index <= currentIndex;
            const isCurrent = index === currentIndex;
            const isLast = index === STEPS.length - 1;

            return (
              <li key={step.status} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${
                      done ? "border-kc-ink bg-kc-ink" : "border-kc-line bg-kc-white"
                    }`}
                  >
                    {done ? (
                      <Check className="h-3.5 w-3.5 text-kc-paper" aria-hidden="true" />
                    ) : null}
                  </span>
                  {!isLast ? (
                    <span
                      className={`w-px flex-1 ${index < currentIndex ? "bg-kc-ink" : "bg-kc-line"}`}
                    />
                  ) : null}
                </div>

                <div className={`pb-6 ${isLast ? "pb-0" : ""}`}>
                  <p
                    className={`text-sm font-medium ${done ? "text-kc-ink" : "text-kc-muted"}`}
                    aria-current={isCurrent ? "step" : undefined}
                  >
                    {step.label}
                    {isCurrent ? <span className="sr-only"> — current status</span> : null}
                  </p>
                  <p className="mt-0.5 text-xs text-kc-muted">{step.description}</p>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <div className="mt-6 border-t border-kc-line pt-4">
        <h3 className="kc-eyebrow text-kc-muted">Items</h3>
        <ul className="mt-3 space-y-2 text-sm">
          {order.items.map((item) => (
            <li key={`${item.slug}-${item.size}`} className="flex justify-between gap-4">
              <span className="min-w-0">
                <span className="block truncate text-kc-ink">{item.name}</span>
                <span className="text-xs text-kc-muted">
                  {item.colorName} · {item.size} · Qty {item.quantity}
                </span>
              </span>
              <span className="kc-price shrink-0 font-medium">
                {formatPKR(item.unitPrice * item.quantity)}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-4 flex justify-between border-t border-kc-line pt-3 text-sm font-medium">
          <span>Total</span>
          <span className="kc-price">{formatPKR(order.totals.total)}</span>
        </p>
      </div>
    </section>
  );
}
