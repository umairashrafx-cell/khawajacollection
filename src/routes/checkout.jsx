import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import PageContainer, { PageHeading } from "@/components/layout/PageContainer";
import { useShop } from "@/context/ShopContext";
import { formatPrice } from "@/lib/format";
import { quote, placeOrder } from "@/services/orderService";
import { shippingConfig } from "@/data/promos";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — Khawaja Collection" },
      { name: "description", content: "Complete your Khawaja Collection order with cash on delivery, card or bank transfer." },
      { property: "og:title", content: "Checkout — Khawaja Collection" },
      { property: "og:description", content: "Complete your Khawaja Collection order with cash on delivery, card or bank transfer." },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "/checkout" }],
  }),
  component: CheckoutPage,
});

const FIELDS = [
  { name: "fullName", label: "Full name", type: "text", required: true },
  { name: "phone", label: "Mobile number", type: "tel", required: true },
  { name: "email", label: "Email", type: "email", required: true },
  { name: "address", label: "Street address", type: "text", required: true },
  { name: "city", label: "City", type: "text", required: true },
  { name: "postcode", label: "Postal code", type: "text", required: false },
];

function CheckoutPage() {
  const { cart, clearCart, hydrated } = useShop();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState({});
  const [payment, setPayment] = useState("cod");
  const [promo, setPromo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const totals = quote(cart, promo);

  const submit = async (e) => {
    e.preventDefault();
    if (!cart.length) return toast.error("Your bag is empty");
    setSubmitting(true);
    const order = await placeOrder({ items: cart, customer, paymentMethod: payment, promo });
    clearCart();
    toast.success("Order placed", { description: `Reference ${order.id}` });
    navigate({ to: "/track-order", search: { id: order.id } });
  };

  if (hydrated && cart.length === 0) {
    return (
      <PageContainer className="py-24 text-center">
        <h1 className="font-serif text-2xl">Your bag is empty</h1>
        <Link to="/category/$slug" params={{ slug: "women" }} className="mt-6 inline-block border-b border-foreground pb-1 text-xs uppercase tracking-[0.2em]">
          Continue shopping
        </Link>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeading eyebrow="Secure checkout" title="Checkout" description="This is a demo checkout — no payment is processed and no card details are stored." />
      <form onSubmit={submit} className="grid gap-12 pb-20 lg:grid-cols-[1fr_340px]">
        <div className="space-y-10">
          <section>
            <h2 className="mb-5 text-sm uppercase tracking-[0.2em]">Delivery details</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {FIELDS.map((f) => (
                <label key={f.name} className={f.name === "address" ? "sm:col-span-2" : ""}>
                  <span className="mb-1.5 block text-xs text-muted-foreground">{f.label}</span>
                  <input
                    type={f.type}
                    required={f.required}
                    value={customer[f.name] || ""}
                    onChange={(e) => setCustomer({ ...customer, [f.name]: e.target.value })}
                    className="w-full border border-border px-3 py-2.5 text-sm outline-none focus:border-gold"
                  />
                </label>
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-5 text-sm uppercase tracking-[0.2em]">Payment method</h2>
            <div className="space-y-3">
              {shippingConfig.paymentMethods.map((m) => (
                <label
                  key={m.id}
                  className={`flex cursor-pointer gap-3 border p-4 ${payment === m.id ? "border-foreground" : "border-border"}`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value={m.id}
                    checked={payment === m.id}
                    onChange={() => setPayment(m.id)}
                    className="mt-1 accent-[var(--gold)]"
                  />
                  <span>
                    <span className="block text-sm">{m.label}</span>
                    <span className="mt-1 block text-xs text-muted-foreground">{m.note}</span>
                  </span>
                </label>
              ))}
            </div>
          </section>
        </div>

        <aside className="h-fit bg-sand p-6">
          <h2 className="text-sm uppercase tracking-[0.2em]">Order summary</h2>
          <ul className="mt-5 space-y-3 text-sm">
            {cart.map((l) => (
              <li key={l.lineId} className="flex justify-between gap-3">
                <span className="text-muted-foreground">
                  {l.name} × {l.quantity}
                </span>
                <span>{formatPrice(l.price * l.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-5 flex gap-2">
            <input
              value={promo}
              onChange={(e) => setPromo(e.target.value)}
              placeholder="Promo code"
              aria-label="Promo code"
              className="w-full border border-border bg-background px-3 py-2 text-sm outline-none focus:border-gold"
            />
          </div>
          {promo && (
            <p className="mt-2 text-xs text-muted-foreground">
              {totals.promoApplied ? "Promo applied" : "Code not recognised"}
            </p>
          )}
          <dl className="mt-5 space-y-2 border-t border-border pt-4 text-sm">
            <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatPrice(totals.subtotal)}</dd></div>
            {totals.discount > 0 && (
              <div className="flex justify-between"><dt>Discount</dt><dd>−{formatPrice(totals.discount)}</dd></div>
            )}
            <div className="flex justify-between"><dt>Delivery</dt><dd>{totals.shipping === 0 ? "Free" : formatPrice(totals.shipping)}</dd></div>
            <div className="flex justify-between border-t border-border pt-3 font-medium"><dt>Total</dt><dd>{formatPrice(totals.total)}</dd></div>
          </dl>
          <button
            type="submit"
            disabled={submitting}
            className="mt-6 w-full bg-foreground py-3.5 text-[11px] uppercase tracking-[0.2em] text-background disabled:opacity-60"
          >
            {submitting ? "Placing order…" : "Place order"}
          </button>
        </aside>
      </form>
    </PageContainer>
  );
}
