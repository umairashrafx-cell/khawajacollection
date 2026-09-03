import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import PageContainer, { PageHeading } from "@/components/layout/PageContainer";
import { listOrders } from "@/services/orderService";
import { formatPrice, formatDate } from "@/lib/format";
import { useWishlist } from "@/store/wishlist-store";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "My Account — Khawaja Collection" },
      {
        name: "description",
        content: "View your Khawaja Collection orders, saved pieces and delivery details.",
      },
      { property: "og:title", content: "My Account — Khawaja Collection" },
      {
        property: "og:description",
        content: "View your Khawaja Collection orders, saved pieces and delivery details.",
      },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "/account" }],
  }),
  component: AccountPage,
});

function AccountPage() {
  const [orders, setOrders] = useState([]);
  const wishlist = useWishlist();

  useEffect(() => {
    listOrders().then(setOrders);
  }, []);

  return (
    <PageContainer>
      <PageHeading
        eyebrow="Account"
        title="My account"
        description="Accounts are not connected yet — orders and saved pieces are stored on this device and will sync once sign-in is enabled."
      />

      <div className="grid gap-10 pb-20 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <h2 className="mb-5 text-sm uppercase tracking-[0.2em]">Order history</h2>
          {orders.length === 0 ? (
            <p className="text-sm text-muted-foreground">No orders placed on this device yet.</p>
          ) : (
            <ul className="divide-y divide-border border-y border-border">
              {orders.map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-4 py-5">
                  <div>
                    <p className="text-sm">{o.id}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDate(o.createdAt)} · {o.items.length} item(s) · {o.status}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">{formatPrice(o.totals.total)}</p>
                    <Link
                      to="/track-order"
                      search={{ id: o.id }}
                      className="text-xs uppercase tracking-[0.16em] underline"
                    >
                      Track
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className="space-y-6">
          <div className="bg-sand p-6">
            <h2 className="text-sm uppercase tracking-[0.2em]">Wishlist</h2>
            <p className="mt-3 text-sm text-muted-foreground">{wishlist.length} saved piece(s)</p>
            <Link
              to="/wishlist"
              className="mt-4 inline-block border-b border-foreground pb-1 text-xs uppercase tracking-[0.2em]"
            >
              View wishlist
            </Link>
          </div>
          <div className="border border-border p-6">
            <h2 className="text-sm uppercase tracking-[0.2em]">Sign in</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Sign-in is coming soon. The interface below is ready to connect to authentication.
            </p>
            <button
              disabled
              className="mt-4 w-full border border-border py-3 text-[11px] uppercase tracking-[0.2em] opacity-50"
            >
              Sign in / Register
            </button>
          </div>
        </aside>
      </div>
    </PageContainer>
  );
}
