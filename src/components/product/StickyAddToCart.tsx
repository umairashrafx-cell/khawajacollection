/**
 * Mobile PDP sticky bar. See docs/BUILD-SPEC.pdf Section 10.2.
 *
 * "Appears once the main Add to Cart scrolls out of view. Shows price + size
 * chip + button." Visibility is measured from the real CTA's position, not a
 * guessed scroll offset.
 *
 * A passive scroll listener rather than an IntersectionObserver, for the same
 * reason useHeaderChrome does not use requestAnimationFrame: when the callback
 * source stalls — some embedded webviews never deliver it — the primary buy
 * button silently never appears for anyone below the fold. Reading one
 * bounding rect on scroll always works and costs nothing measurable.
 */

import { useEffect, useState, type RefObject } from "react";

import { formatPKR } from "@/lib/format";
import { resolvePrice } from "@/lib/format";
import type { Product } from "@/types";

export function StickyAddToCart({
  product,
  watchRef,
  size,
  onAdd,
  disabled,
  madeToOrder,
}: {
  product: Product;
  /** The main CTA block. The bar shows only while this is off screen. */
  watchRef: RefObject<HTMLElement | null>;
  size: string | null;
  onAdd: () => boolean;
  disabled: boolean;
  madeToOrder: boolean;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const read = () => {
      const target = watchRef.current;
      if (!target) return;
      const rect = target.getBoundingClientRect();
      // Off screen means fully above the viewport or fully below it.
      setVisible(rect.bottom < 0 || rect.top > window.innerHeight);
    };

    read();
    window.addEventListener("scroll", read, { passive: true });
    window.addEventListener("resize", read);
    return () => {
      window.removeEventListener("scroll", read);
      window.removeEventListener("resize", read);
    };
  }, [watchRef]);

  // Made-to-order has no add-to-bag action, so it has no sticky bar either.
  if (madeToOrder || !visible) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t border-kc-line bg-kc-paper/95 px-4 py-3 backdrop-blur lg:hidden"
      style={{ boxShadow: "var(--shadow-kc)" }}
    >
      <div className="flex items-center gap-3">
        <div className="min-w-0">
          <p className="kc-price truncate text-sm font-semibold text-kc-ink">
            {formatPKR(resolvePrice(product))}
          </p>
          {size ? (
            <p className="mt-0.5 inline-block border border-kc-line px-1.5 py-0.5 text-[10px] uppercase tracking-[0.06em] text-kc-charcoal">
              Size {size}
            </p>
          ) : (
            <p className="mt-0.5 text-[11px] text-kc-muted">Select a size</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => onAdd()}
          disabled={disabled}
          className="min-h-12 flex-1 bg-kc-ink text-[12px] font-medium uppercase tracking-[0.08em] text-kc-paper disabled:cursor-not-allowed disabled:bg-kc-muted"
        >
          {disabled ? "Out of stock" : "Add to bag"}
        </button>
      </div>
    </div>
  );
}
