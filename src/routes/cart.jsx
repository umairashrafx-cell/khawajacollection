import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, Trash2 } from "lucide-react";
import PageContainer, { PageHeading } from "@/components/layout/PageContainer";
import { useShop } from "@/context/ShopContext";
import { formatPrice } from "@/lib/format";
import { quote } from "@/services/orderService";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Shopping Bag — Khawaja Collection" },
      {
        name: "description",
        content: "Review the pieces in your Khawaja Collection shopping bag before checkout.",
      },
      { property: "og:title", content: "Shopping Bag — Khawaja Collection" },
      {
        property: "og:description",
        content: "Review the pieces in your Khawaja Collection shopping bag before checkout.",
      },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "/cart" }],
  }),
  component: CartPage,
});

function CartPage() {
  const { cart, updateQuantity, removeFromCart, hydrated } = useShop();
  const totals = quote(cart, null);

  return (
    <PageContainer>
      <PageHeading eyebrow="Checkout" title="Shopping bag" />

      {hydrated && cart.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-sm text-muted-foreground">Your bag is empty.</p>
          <Link
            to="/category/$slug"
            params={{ slug: "women" }}
            className="mt-6 inline-block border-b border-foreground pb-1 text-xs uppercase tracking-[0.2em]"
          >
            Continue shopping
          </Link>
        </div>
      ) : (
        <div className="grid gap-12 pb-20 lg:grid-cols-[1fr_340px]">
          <ul className="divide-y divide-border border-y border-border">
            {cart.map((line) => (
              <li key={line.lineId} className="flex gap-4 py-6">
                <img
                  src={line.image}
                  alt=""
                  loading="lazy"
                  className="h-36 w-[104px] object-cover"
                />
                <div className="flex-1">
                  <Link to="/product/$slug" params={{ slug: line.slug }} className="text-sm">
                    {line.name}
                  </Link>
                  {line.size && (
                    <p className="mt-1 text-xs text-muted-foreground">Size {line.size}</p>
                  )}
                  <p className="mt-2 text-sm">{formatPrice(line.price)}</p>
                  <div className="mt-4 flex items-center gap-4">
                    <div className="flex items-center border border-border">
                      <button
                        className="px-2.5 py-1.5"
                        aria-label="Decrease quantity"
                        onClick={() => updateQuantity(line.lineId, line.quantity - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-8 text-center text-sm">{line.quantity}</span>
                      <button
                        className="px-2.5 py-1.5"
                        aria-label="Increase quantity"
                        onClick={() => updateQuantity(line.lineId, line.quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <button onClick={() => removeFromCart(line.lineId)} aria-label="Remove item">
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </div>
                </div>
                <p className="text-sm">{formatPrice(line.price * line.quantity)}</p>
              </li>
            ))}
          </ul>

          <aside className="h-fit bg-sand p-6">
            <h2 className="text-sm uppercase tracking-[0.2em]">Order summary</h2>
            <dl className="mt-5 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt>Subtotal</dt>
                <dd>{formatPrice(totals.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Delivery</dt>
                <dd>{totals.shipping === 0 ? "Free" : formatPrice(totals.shipping)}</dd>
              </div>
              <div className="flex justify-between border-t border-border pt-3 font-medium">
                <dt>Total</dt>
                <dd>{formatPrice(totals.total)}</dd>
              </div>
            </dl>
            <Link
              to="/checkout"
              className="mt-6 block bg-foreground py-3.5 text-center text-[11px] uppercase tracking-[0.2em] text-background"
            >
              Proceed to checkout
            </Link>
          </aside>
        </div>
      )}
    </PageContainer>
  );
}
