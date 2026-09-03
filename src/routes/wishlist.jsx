import { createFileRoute, Link } from "@tanstack/react-router";
import { X } from "lucide-react";
import PageContainer, { PageHeading } from "@/components/layout/PageContainer";
import { useShop } from "@/context/ShopContext";
import { formatPrice } from "@/lib/format";

export const Route = createFileRoute("/wishlist")({
  head: () => ({
    meta: [
      { title: "Wishlist — Khawaja Collection" },
      {
        name: "description",
        content: "Pieces you have saved from the Khawaja Collection catalogue.",
      },
      { property: "og:title", content: "Wishlist — Khawaja Collection" },
      {
        property: "og:description",
        content: "Pieces you have saved from the Khawaja Collection catalogue.",
      },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "/wishlist" }],
  }),
  component: WishlistPage,
});

function WishlistPage() {
  const { wishlist, toggleWishlist, hydrated } = useShop();

  return (
    <PageContainer>
      <PageHeading
        eyebrow="Saved"
        title="Wishlist"
        description="Saved on this device. Sign in to sync your wishlist across devices once accounts are live."
      />

      {hydrated && wishlist.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-sm text-muted-foreground">Nothing saved yet.</p>
          <Link
            to="/category/$slug"
            params={{ slug: "women" }}
            className="mt-6 inline-block border-b border-foreground pb-1 text-xs uppercase tracking-[0.2em]"
          >
            Browse the collection
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 pb-20 lg:grid-cols-4">
          {wishlist.map((item) => (
            <article key={item.id} className="relative">
              <Link to="/product/$slug" params={{ slug: item.slug }} className="block bg-sand">
                <img
                  src={item.image}
                  alt={item.name}
                  loading="lazy"
                  className="aspect-[3/4] w-full object-cover"
                />
              </Link>
              <button
                onClick={() => toggleWishlist(item)}
                aria-label={`Remove ${item.name} from wishlist`}
                className="absolute right-2 top-2 rounded-full bg-background/85 p-2"
              >
                <X className="h-4 w-4" />
              </button>
              <p className="pt-3 text-sm">{item.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">{formatPrice(item.price)}</p>
            </article>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
