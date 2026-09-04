/**
 * The PDP info column. See docs/BUILD-SPEC.pdf Section 11.3.
 *
 * Order is fixed by the spec: category eyebrow, h1, rating and review count,
 * price block, short description, colour, size plus size-guide link, quantity,
 * Add to Cart and Buy Now, wishlist, trust row.
 *
 * This component owns the selection state, so it also renders StickyAddToCart —
 * that bar has to know the chosen size and price, and one owner beats syncing
 * two.
 */

import { useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Banknote, Heart, MessageCircle, RefreshCw, Star, Truck } from "lucide-react";

import { PLACEHOLDER, commerce, contact, hasRealReviews, site } from "@/config/site";
import { formatPKR, labelFromSlug } from "@/lib/format";
import {
  colorOptions,
  defaultColor,
  defaultSize,
  findVariant,
  sizesForColor,
} from "@/lib/product-variants";
import { announce } from "@/store/announcer";
import { addToCart } from "@/store/cart-store";
import { openOverlay } from "@/store/ui-store";
import { toggleWishlist, useIsWishlisted, useWishlistHydrated } from "@/store/wishlist-store";
import type { Product } from "@/types";
import { PriceBlock } from "./PriceBlock";
import { SizeGuideDialog } from "./SizeGuideDialog";
import { StickyAddToCart } from "./StickyAddToCart";
import { ColorSelector, QuantityStepper, SizeSelector } from "./VariantSelectors";

export function ProductInfo({ product }: { product: Product }) {
  const navigate = useNavigate();
  const wishlistHydrated = useWishlistHydrated();
  const wishlisted = useIsWishlisted(product.id);

  const colors = colorOptions(product);
  const [color, setColor] = useState<string | null>(() => defaultColor(product));
  const [size, setSize] = useState<string | null>(() =>
    defaultSize(product, defaultColor(product)),
  );
  const [quantity, setQuantity] = useState(1);
  const [guideOpen, setGuideOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ctaRef = useRef<HTMLDivElement | null>(null);

  const sizes = sizesForColor(product, color);
  const variant = findVariant(product, color, size);
  const needsSize = sizes.length > 1 && size === null;
  const selectedUnavailable = size !== null && variant !== null && variant.stock <= 0;
  const canBuy = !product.isMadeToOrder && !needsSize && !selectedUnavailable && variant !== null;

  const eyebrow = labelFromSlug(
    product.subcategorySlug ?? product.categorySlug,
    product.categorySlug,
  );
  const saved = wishlistHydrated && wishlisted;
  const whatsapp: string = contact.whatsapp;
  const whatsappReady = whatsapp !== PLACEHOLDER;

  function onColorChange(next: string) {
    setColor(next);
    setError(null);
    // The chosen size may not exist in the new colour; drop it rather than
    // silently keeping a selection that cannot be bought.
    const available = sizesForColor(product, next);
    if (size !== null && !available.some((option) => option.size === size && option.inStock)) {
      setSize(available.length === 1 ? (available[0]?.size ?? null) : null);
    }
  }

  function add(): boolean {
    if (needsSize) {
      // Section 11.3: inline text, not a toast.
      setError("Choose a size first.");
      return false;
    }
    if (!canBuy || !variant) return false;
    addToCart(product, variant, quantity);
    announce(
      `${product.name}${size ? `, size ${size}` : ""}, added to your bag. Quantity ${quantity}.`,
    );
    toast.success("Added to bag", { description: product.name });
    openOverlay("cart");
    setError(null);
    return true;
  }

  return (
    <div>
      <p className="kc-eyebrow text-kc-muted">{eyebrow}</p>
      <h1 className="mt-2 font-display text-[26px] leading-tight text-kc-ink md:text-[36px]">
        {product.name}
      </h1>

      {/* Hidden while `hasRealReviews` is false. The same reasoning as the
          JSON-LD on the PDP route: these ratings are generated, and telling a
          shopper "4.6 (23 reviews)" when no customer has reviewed anything is
          the same fabrication, just aimed at a person instead of a crawler. */}
      {hasRealReviews ? (
        <div className="mt-3 flex items-center gap-2">
          <Stars rating={product.rating} />
          <span className="text-xs text-kc-charcoal">
            {product.rating.toFixed(1)} ({product.reviewCount} reviews)
          </span>
        </div>
      ) : null}

      <PriceBlock product={product} size="lg" className="mt-4" />

      <p className="mt-4 text-sm text-kc-charcoal">{product.shortDescription}</p>

      <div className="mt-7 space-y-7">
        <ColorSelector colors={colors} selected={color} onSelect={onColorChange} />
        <SizeSelector
          sizes={sizes}
          selected={size}
          onSelect={(next) => {
            setSize(next);
            setError(null);
          }}
          onOpenGuide={() => setGuideOpen(true)}
        />
        {!product.isMadeToOrder ? (
          <QuantityStepper value={quantity} max={variant?.stock ?? 10} onChange={setQuantity} />
        ) : null}
      </div>

      <div ref={ctaRef} className="mt-8 space-y-3">
        {product.isMadeToOrder ? (
          <MadeToOrderCta ready={whatsappReady} number={whatsapp} productName={product.name} />
        ) : (
          <>
            <button
              type="button"
              onClick={() => add()}
              disabled={selectedUnavailable}
              className="min-h-13 w-full bg-kc-ink py-4 text-[12px] font-medium uppercase tracking-[0.08em] text-kc-paper transition-colors hover:bg-kc-charcoal disabled:cursor-not-allowed disabled:bg-kc-muted"
            >
              {selectedUnavailable ? "Out of stock" : "Add to bag"}
            </button>
            <button
              type="button"
              onClick={() => {
                if (add()) void navigate({ to: "/checkout" });
              }}
              disabled={selectedUnavailable}
              className="min-h-13 w-full border border-kc-ink py-4 text-[12px] font-medium uppercase tracking-[0.08em] text-kc-ink transition-colors hover:bg-kc-ink hover:text-kc-paper disabled:cursor-not-allowed disabled:border-kc-line disabled:text-kc-muted"
            >
              Buy now
            </button>
          </>
        )}

        {error ? (
          <p role="alert" className="text-sm text-kc-sale">
            {error}
          </p>
        ) : null}
        {selectedUnavailable ? (
          <p className="text-sm text-kc-charcoal">
            Size {size} is out of stock in {color}. Try another size or colour.
          </p>
        ) : null}

        <button
          type="button"
          onClick={() => {
            const nowSaved = toggleWishlist(product);
            announce(
              nowSaved
                ? `${product.name} saved to your wishlist.`
                : `${product.name} removed from your wishlist.`,
            );
          }}
          aria-pressed={saved}
          className="flex min-h-11 items-center gap-2 text-sm text-kc-charcoal hover:text-kc-ink"
        >
          <Heart
            className={`h-4 w-4 ${saved ? "fill-kc-sale text-kc-sale" : ""}`}
            aria-hidden="true"
          />
          {saved ? "Saved to wishlist" : "Save to wishlist"}
        </button>
      </div>

      <TrustRow madeToOrder={product.isMadeToOrder === true} />

      <SizeGuideDialog
        open={guideOpen}
        onClose={() => setGuideOpen(false)}
        categorySlug={product.categorySlug}
      />

      <StickyAddToCart
        product={product}
        watchRef={ctaRef}
        size={size}
        onAdd={add}
        disabled={selectedUnavailable}
        madeToOrder={product.isMadeToOrder === true}
      />
    </div>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex gap-0.5" aria-hidden="true">
      {[1, 2, 3, 4, 5].map((step) => (
        <Star
          key={step}
          className={`h-3.5 w-3.5 ${
            step <= Math.round(rating) ? "fill-kc-gold text-kc-gold" : "text-kc-line"
          }`}
        />
      ))}
    </span>
  );
}

/**
 * Section 16 — bridal is made to order, so Add to Cart becomes an enquiry.
 * The WhatsApp number is a PLACEHOLDER in config, and a wa.me link built from
 * a placeholder is a broken link, so the CTA states plainly that the channel is
 * not connected yet instead of pretending. It becomes a live link the moment
 * `contact.whatsapp` is set.
 */
function MadeToOrderCta({
  ready,
  number,
  productName,
}: {
  ready: boolean;
  number: string;
  productName: string;
}) {
  const message = `Hello ${site.name}, I would like to enquire about "${productName}".`;

  if (!ready) {
    return (
      <div>
        <button
          type="button"
          disabled
          className="min-h-13 w-full cursor-not-allowed bg-kc-muted py-4 text-[12px] font-medium uppercase tracking-[0.08em] text-kc-paper"
        >
          <MessageCircle className="mr-2 inline h-4 w-4" aria-hidden="true" />
          Enquire on WhatsApp
        </button>
        <p className="mt-2 text-xs text-kc-muted">
          Made to order. The WhatsApp number is not connected yet — set{" "}
          <code>contact.whatsapp</code> in site config to enable this.
        </p>
      </div>
    );
  }

  return (
    <div>
      <a
        href={`https://wa.me/${number.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(message)}`}
        target="_blank"
        rel="noreferrer noopener"
        className="flex min-h-13 w-full items-center justify-center bg-kc-ink py-4 text-[12px] font-medium uppercase tracking-[0.08em] text-kc-paper transition-colors hover:bg-kc-charcoal"
      >
        <MessageCircle className="mr-2 h-4 w-4" aria-hidden="true" />
        Enquire on WhatsApp
      </a>
      <p className="mt-2 text-xs text-kc-muted">
        Made to order. We confirm measurements and timeline before starting.
      </p>
    </div>
  );
}

/** Section 11.3 — COD, easy exchange, delivery estimate. */
function TrustRow({ madeToOrder }: { madeToOrder: boolean }) {
  const rows: { Icon: typeof Truck; text: string }[] = [
    { Icon: Banknote, text: "Cash on delivery available" },
    { Icon: RefreshCw, text: "Easy exchange on unworn pieces" },
    {
      Icon: Truck,
      text:
        commerce.deliveryEstimate !== null
          ? `Delivery in ${commerce.deliveryEstimate}`
          : `Free delivery over ${formatPKR(commerce.freeDeliveryThreshold)}`,
    },
  ];

  return (
    <ul className="mt-8 space-y-2.5 border-t border-kc-line pt-6">
      {rows.map(({ Icon, text }) => (
        <li key={text} className="flex items-center gap-2.5 text-sm text-kc-charcoal">
          <Icon className="h-4 w-4 shrink-0 text-kc-muted" aria-hidden="true" />
          {text}
        </li>
      ))}
      {madeToOrder ? (
        <li className="text-sm text-kc-charcoal">Made-to-order pieces cannot be exchanged.</li>
      ) : null}
    </ul>
  );
}
