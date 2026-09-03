import { Link } from "@tanstack/react-router";
import { X, Minus, Plus } from "lucide-react";
import { useShop } from "@/context/ShopContext";
import { formatPrice } from "@/lib/format";
import { quote } from "@/services/orderService";

export default function CartDrawer() {
  const { cart, cartOpen, setCartOpen, updateQuantity, removeFromCart } = useShop();
  const totals = quote(cart, null);

  return (
    <div className={`fixed inset-0 z-50 ${cartOpen ? "" : "pointer-events-none"}`} aria-hidden={!cartOpen}>
      <div
        className={`absolute inset-0 bg-foreground/40 transition-opacity duration-300 ${cartOpen ? "opacity-100" : "opacity-0"}`}
        onClick={() => setCartOpen(false)}
      />
      <aside
        className={`absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-background transition-transform duration-300 ${cartOpen ? "translate-x-0" : "translate-x-full"}`}
        aria-label="Shopping bag"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-sm uppercase tracking-[0.2em]">Shopping Bag</h2>
          <button onClick={() => setCartOpen(false)} aria-label="Close bag" className="p-1">
            <X className="h-5 w-5" />
          </button>
        </div>

        {cart.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <p className="text-sm text-muted-foreground">Your bag is empty.</p>
            <Link
              to="/category/$slug"
              params={{ slug: "women" }}
              onClick={() => setCartOpen(false)}
              className="border-b border-foreground pb-1 text-xs uppercase tracking-[0.2em]"
            >
              Start shopping
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
              {cart.map((line) => (
                <li key={line.lineId} className="flex gap-4">
                  <img src={line.image} alt="" loading="lazy" className="h-28 w-20 object-cover" />
                  <div className="flex-1">
                    <p className="text-sm">{line.name}</p>
                    {line.size && (
                      <p className="mt-1 text-xs text-muted-foreground">Size {line.size}</p>
                    )}
                    <p className="mt-1 text-sm">{formatPrice(line.price)}</p>
                    <div className="mt-3 flex items-center gap-3">
                      <div className="flex items-center border border-border">
                        <button
                          className="px-2 py-1"
                          aria-label="Decrease quantity"
                          onClick={() => updateQuantity(line.lineId, line.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-7 text-center text-sm">{line.quantity}</span>
                        <button
                          className="px-2 py-1"
                          aria-label="Increase quantity"
                          onClick={() => updateQuantity(line.lineId, line.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromCart(line.lineId)}
                        className="text-xs text-muted-foreground underline"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="border-t border-border px-5 py-5">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>{formatPrice(totals.subtotal)}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {totals.shipping === 0 ? "Free delivery applied" : `Delivery ${formatPrice(totals.shipping)}`}
              </p>
              <Link
                to="/checkout"
                onClick={() => setCartOpen(false)}
                className="mt-4 block bg-foreground py-3 text-center text-xs uppercase tracking-[0.2em] text-background"
              >
                Checkout
              </Link>
              <Link
                to="/cart"
                onClick={() => setCartOpen(false)}
                className="mt-2 block py-2 text-center text-xs uppercase tracking-[0.2em] text-muted-foreground"
              >
                View bag
              </Link>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
