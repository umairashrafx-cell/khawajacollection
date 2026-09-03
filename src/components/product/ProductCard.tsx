/**
 * The most reused component in the app. See docs/BUILD-SPEC.pdf Section 10.1.
 *
 * The card is a link. The wishlist heart and quick add sit above it as buttons
 * that preventDefault, so a click on either never navigates. The image lives in
 * a fixed 3:4 frame, which is what stops the grid moving as images load.
 *
 * Quick View (Section 10.1) is deliberately absent: it needs QuickViewDialog,
 * which the spec schedules for Phase 6's dynamic-import list. A hover bar that
 * opens nothing would be worse than no hover bar.
 */

import { Image } from "@/components/media/Image";
import { AppLink } from "@/components/layout/AppLink";
import { labelFromSlug } from "@/lib/format";
import { isSoldOut } from "@/lib/legacy-shop-adapter";
import type { Product } from "@/types";
import { PriceBlock } from "./PriceBlock";
import { ProductBadgeStack } from "./ProductBadge";
import { QuickAddButton } from "./QuickAddButton";
import { WishlistButton } from "./WishlistButton";

/** A grid cell is a quarter of the row at desktop, half on mobile. */
const CARD_SIZES =
  "(min-width: 1280px) 320px, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw";

export interface ProductCardProps {
  product: Product;
  /** True only for the first row above the fold. */
  priority?: boolean;
  /** Hidden below `md` regardless — a size picker does not belong in a phone grid cell. */
  showQuickAdd?: boolean;
  /**
   * Fifth prop, beyond the four in Section 10.1, because Section 11.1 item 9
   * requires white type on the ink sale block and the card owns that text.
   */
  tone?: "default" | "inverse";
  className?: string;
}

export function ProductCard({
  product,
  priority = false,
  showQuickAdd = true,
  tone = "default",
  className = "",
}: ProductCardProps) {
  const inverse = tone === "inverse";
  const primary = product.images[0];
  const secondary = product.images[1];

  if (!primary) return null;

  const soldOut = isSoldOut(product);
  const eyebrow = labelFromSlug(
    product.subcategorySlug ?? product.categorySlug,
    product.categorySlug,
  );

  return (
    <article className={`group ${className}`}>
      <div className="relative overflow-hidden bg-kc-sand">
        <AppLink href={`/products/${product.slug}`} tabIndex={-1} aria-hidden="true">
          {/* Fixed 3:4 frame, enforced everywhere with no exceptions (Section 6.4). */}
          <Image
            src={primary.url}
            alt={primary.alt}
            width={primary.width}
            height={primary.height}
            sizes={CARD_SIZES}
            priority={priority}
            className="aspect-[3/4] w-full object-cover"
          />

          {secondary ? (
            // Cross-fade to the second image, 300ms ease-out. No zoom, no lift.
            // Hover-capable pointers only, so it never fires on a tap.
            <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 ease-out can-hover:group-hover:opacity-100">
              <Image
                src={secondary.url}
                alt=""
                width={secondary.width}
                height={secondary.height}
                sizes={CARD_SIZES}
                className="aspect-[3/4] w-full object-cover"
              />
            </div>
          ) : null}
        </AppLink>

        {soldOut ? (
          <div className="pointer-events-none absolute inset-0 bg-kc-paper/55" aria-hidden="true" />
        ) : null}

        <ProductBadgeStack product={product} />

        <div className="absolute right-1 top-1 md:right-2 md:top-2">
          <WishlistButton product={product} />
        </div>

        {showQuickAdd ? (
          <div className="absolute inset-x-0 bottom-0 hidden opacity-0 transition-opacity duration-200 group-focus-within:opacity-100 md:block can-hover:group-hover:opacity-100">
            <QuickAddButton product={product} />
          </div>
        ) : null}
      </div>

      <AppLink href={`/products/${product.slug}`} className="mt-3 block">
        <p className={`kc-eyebrow ${inverse ? "text-kc-paper/60" : "text-kc-muted"}`}>{eyebrow}</p>
        <h3
          className={`mt-1.5 line-clamp-2 text-[13px] leading-snug md:text-sm ${
            inverse ? "text-kc-paper" : "text-kc-ink"
          }`}
        >
          {product.name}
        </h3>
        <PriceBlock product={product} tone={tone} className="mt-1.5" />
      </AppLink>
    </article>
  );
}

/** Rendered by ProductGrid while a list is loading (Section 10.2). */
export function ProductCardSkeleton() {
  return (
    <div className="animate-pulse" aria-hidden="true">
      <div className="aspect-[3/4] w-full bg-kc-sand" />
      <div className="mt-3 h-2.5 w-1/3 bg-kc-sand" />
      <div className="mt-2 h-3 w-4/5 bg-kc-sand" />
      <div className="mt-2 h-3 w-1/4 bg-kc-sand" />
    </div>
  );
}
