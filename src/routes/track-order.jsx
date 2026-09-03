import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Check } from "lucide-react";
import PageContainer, { PageHeading } from "@/components/layout/PageContainer";
import { getOrder } from "@/services/orderService";
import { formatPrice, formatDate } from "@/lib/format";

export const Route = createFileRoute("/track-order")({
  validateSearch: (search) => ({ id: typeof search.id === "string" ? search.id : "" }),
  head: () => ({
    meta: [
      { title: "Track Your Order — Khawaja Collection" },
      {
        name: "description",
        content:
          "Enter your Khawaja Collection order reference to see its current delivery status.",
      },
      { property: "og:title", content: "Track Your Order — Khawaja Collection" },
      {
        property: "og:description",
        content:
          "Enter your Khawaja Collection order reference to see its current delivery status.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/track-order" },
    ],
    links: [{ rel: "canonical", href: "/track-order" }],
  }),
  component: TrackOrderPage,
});

function TrackOrderPage() {
  const { id } = Route.useSearch();
  const navigate = useNavigate();
  const [value, setValue] = useState(id);
  const [order, setOrder] = useState(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    setValue(id);
    if (!id) return setOrder(null);
    getOrder(id).then((o) => {
      setOrder(o);
      setChecked(true);
    });
  }, [id]);

  return (
    <PageContainer>
      <PageHeading
        eyebrow="Support"
        title="Track your order"
        description="Your order reference was shown at checkout, e.g. KC12345678."
      />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          navigate({ to: "/track-order", search: { id: value } });
        }}
        className="mb-12 flex max-w-md gap-3"
      >
        <label htmlFor="order-id" className="sr-only">
          Order reference
        </label>
        <input
          id="order-id"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Order reference"
          className="flex-1 border border-border px-4 py-3 text-sm outline-none focus:border-gold"
        />
        <button className="bg-foreground px-6 text-[11px] uppercase tracking-[0.2em] text-background">
          Track
        </button>
      </form>

      {id && checked && !order && (
        <p className="pb-20 text-sm text-muted-foreground">
          No order found for that reference on this device.
        </p>
      )}

      {order && (
        <div className="grid gap-10 pb-20 lg:grid-cols-[1fr_340px]">
          <section>
            <p className="text-sm">Order {order.id}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Placed {formatDate(order.createdAt)}
            </p>
            <ol className="mt-8 space-y-6">
              {order.timeline.map((step) => (
                <li key={step.label} className="flex items-center gap-4">
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full border ${step.done ? "border-gold bg-gold" : "border-border"}`}
                  >
                    {step.done && <Check className="h-4 w-4" />}
                  </span>
                  <span className={`text-sm ${step.done ? "" : "text-muted-foreground"}`}>
                    {step.label}
                  </span>
                </li>
              ))}
            </ol>
          </section>
          <aside className="h-fit bg-sand p-6">
            <h2 className="text-sm uppercase tracking-[0.2em]">Summary</h2>
            <ul className="mt-5 space-y-3 text-sm">
              {order.items.map((l) => (
                <li key={l.lineId} className="flex justify-between gap-3">
                  <span className="text-muted-foreground">
                    {l.name} × {l.quantity}
                  </span>
                  <span>{formatPrice(l.price * l.quantity)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-5 flex justify-between border-t border-border pt-4 text-sm font-medium">
              <span>Total</span>
              <span>{formatPrice(order.totals.total)}</span>
            </p>
            <p className="mt-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
              {order.paymentMethod}
            </p>
          </aside>
        </div>
      )}
    </PageContainer>
  );
}
