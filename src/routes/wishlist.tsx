/**
 * Wishlist page. See docs/BUILD-SPEC.pdf Sections 7 and 11.6.
 *
 * Guest list in localStorage. "Move to cart" needs a size, so it opens a
 * compact picker, fetching that product's variants on demand.
 *
 * noindex per Section 7.
 */

import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { X } from "lucide-react";

import { AppLink } from "@/components/layout/AppLink";
import { Container } from "@/components/layout/Container";
import { Image } from "@/components/media/Image";
import { formatPKR } from "@/lib/format";
import { defaultColor, findVariant, sizesForColor } from "@/lib/product-variants";
import { announce } from "@/store/announcer";
import { addToCart } from "@/store/cart-store";
import { openOverlay } from "@/store/ui-store";
import {
  removeFromWishlist,
  useWishlist,
  useWishlistHydrated,
  type WishlistEntry,
} from "@/store/wishlist-store";
import type { Product } from "@/types";

export const Route = createFileRoute("/wishlist")({
  head: () => ({
    meta: [
      { title: "Wishlist | Khawaja Collection" },
      { name: "description", content: "The pieces you have saved on this device." },
      { name: "robots", content: "noindex, nofollow" },
    ],
    links: [{ rel: "canonical", href: "/wishlist" }],
  }),
  component: WishlistPage,
});

function WishlistPage() {
  const entries = useWishlist();
  const hydrated = useWishlistHydrated();

  return (
    <Container>
      <div className="py-10 lg:py-14">
        <h1 className="font-display text-[28px] leading-tight md:text-[40px]">Wishlist</h1>
        <p className="mt-3 max-w-xl text-sm text-kc-charcoal">
          Saved on this device. Sign in once accounts are live to keep them anywhere.
        </p>

        {!hydrated ? (
          <p className="mt-10 text-sm text-kc-muted">Loading your wishlist…</p>
        ) : entries.length === 0 ? (
          <EmptyWishlist />
        ) : (
          <ul className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
            {entries.map((entry) => (
              <li key={entry.productId}>
                <WishlistCard entry={entry} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </Container>
  );
}

function WishlistCard({ entry }: { entry: WishlistEntry }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [picking, setPicking] = useState(false);
  const [loading, setLoading] = useState(false);

  async function startMove() {
    setLoading(true);
    try {
      const response = await fetch(`/api/product?slug=${encodeURIComponent(entry.slug)}`);
      if (!response.ok) throw new Error("unavailable");
      const full = (await response.json()) as Product;
      setProduct(full);

      const color = defaultColor(full);
      const sizes = sizesForColor(full, color);
      const inStock = sizes.filter((size) => size.inStock);

      // One size and nothing to choose — move it straight across.
      if (inStock.length === 1 && inStock[0]) {
        move(full, inStock[0].size);
        return;
      }
      setPicking(true);
    } catch {
      toast.error("That piece is no longer available");
    } finally {
      setLoading(false);
    }
  }

  function move(full: Product, size: string) {
    const color = defaultColor(full);
    const variant = findVariant(full, color, size);
    if (!variant) return;
    addToCart(full, variant, 1);
    removeFromWishlist(entry.productId);
    announce(`${full.name}, size ${size}, moved from your wishlist to your bag.`);
    toast.success("Moved to bag", { description: full.name });
    setPicking(false);
    openOverlay("cart");
  }

  const sizes = product ? sizesForColor(product, defaultColor(product)) : [];

  return (
    <article className="group relative">
      <div className="relative overflow-hidden bg-kc-sand">
        <AppLink href={`/products/${entry.slug}`}>
          <Image
            src={entry.image}
            alt={entry.alt}
            width={900}
            height={1200}
            sizes="(min-width: 1024px) 25vw, 50vw"
            className="aspect-[3/4] w-full object-cover"
          />
        </AppLink>
        <button
          type="button"
          onClick={() => {
            removeFromWishlist(entry.productId);
            announce(`${entry.name} removed from your wishlist.`);
          }}
          aria-label={`Remove ${entry.name} from wishlist`}
          className="absolute right-1 top-1 flex h-11 w-11 items-center justify-center bg-kc-paper/80 text-kc-ink md:right-2 md:top-2 md:h-9 md:w-9"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <AppLink href={`/products/${entry.slug}`} className="mt-3 block">
        <h2 className="line-clamp-2 text-[13px] leading-snug text-kc-ink md:text-sm">
          {entry.name}
        </h2>
        <p className="kc-price mt-1.5 text-[13px] font-semibold md:text-sm">
          {formatPKR(entry.price)}
        </p>
      </AppLink>

      {picking && product ? (
        <div className="mt-3">
          <p className="kc-eyebrow mb-1.5 text-kc-muted">Choose a size</p>
          <div className="flex flex-wrap gap-1.5">
            {sizes.map((option) => (
              <button
                key={option.size}
                type="button"
                disabled={!option.inStock}
                onClick={() => move(product, option.size)}
                aria-label={
                  option.inStock
                    ? `Move size ${option.size} to bag`
                    : `Size ${option.size} sold out`
                }
                className={`min-h-9 min-w-9 border px-2 text-xs ${
                  option.inStock
                    ? "border-kc-line text-kc-ink hover:border-kc-ink"
                    : "cursor-not-allowed border-kc-line text-kc-muted line-through"
                }`}
              >
                {option.size}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={startMove}
          disabled={loading}
          className="mt-3 min-h-11 w-full border border-kc-ink text-[11px] font-medium uppercase tracking-[0.08em] text-kc-ink transition-colors hover:bg-kc-ink hover:text-kc-paper disabled:opacity-60"
        >
          {loading ? "Checking…" : "Move to bag"}
        </button>
      )}
    </article>
  );
}

function EmptyWishlist() {
  return (
    <div className="mt-10 border border-kc-line bg-kc-white px-6 py-16 text-center">
      <h2 className="font-display text-xl text-kc-ink">Nothing saved yet</h2>
      <p className="mx-auto mt-3 max-w-sm text-sm text-kc-charcoal">
        Tap the heart on any piece to keep it here while you decide.
      </p>
      <AppLink
        href="/new-arrivals"
        className="mt-7 inline-flex min-h-11 items-center justify-center bg-kc-ink px-7 text-[12px] font-medium uppercase tracking-[0.08em] text-kc-paper"
      >
        Shop new in
      </AppLink>
    </div>
  );
}
