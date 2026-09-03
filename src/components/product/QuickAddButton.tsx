/**
 * Quick add from a product card. See docs/BUILD-SPEC.pdf Section 10.1.
 *
 * "Quick Add opens a compact size picker if the product has multiple sizes;
 * adds directly if there is only one." Unavailable sizes are struck through
 * and disabled rather than hidden (Section 10.2, SizeSelector).
 *
 * Desktop affordance: the card hides it below `md`, where the size picker
 * belongs on the PDP rather than inside a two-column grid cell.
 */

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { findVariant, sizesForColor, defaultColor } from "@/lib/product-variants";
import { announce } from "@/store/announcer";
import { addToCart } from "@/store/cart-store";
import { openOverlay } from "@/store/ui-store";
import type { Product } from "@/types";

export interface QuickAddButtonProps {
  product: Product;
}

export function QuickAddButton({ product }: QuickAddButtonProps) {
  const [picking, setPicking] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Quick add always uses the product's default colour; choosing a colour is
  // the PDP's job, not a grid cell's.
  const color = defaultColor(product);
  const sizes = sizesForColor(product, color);
  const soldOut = sizes.every((option) => !option.inStock);

  useEffect(() => {
    if (!picking) return;
    const onDocumentClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setPicking(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPicking(false);
    };
    document.addEventListener("mousedown", onDocumentClick);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onDocumentClick);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [picking]);

  const stop = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const add = (size: string) => {
    const variant = findVariant(product, color, size);
    if (!variant) return;
    addToCart(product, variant, 1);
    announce(`${product.name}, size ${size}, added to your bag.`);
    toast.success("Added to bag", { description: product.name });
    setPicking(false);
    // Section 6.5 — adding opens the bag so the change is visible.
    openOverlay("cart");
  };

  if (soldOut) {
    return (
      <span className="block w-full bg-kc-ink/60 py-2.5 text-center text-[11px] font-medium uppercase tracking-[0.08em] text-kc-white">
        Sold out
      </span>
    );
  }

  // Made-to-order bridal never quick-adds; Section 16 routes it to an enquiry
  // on the PDP instead.
  if (product.isMadeToOrder) {
    return (
      <span className="block w-full bg-kc-ink py-2.5 text-center text-[11px] font-medium uppercase tracking-[0.08em] text-kc-paper">
        Made to order
      </span>
    );
  }

  const onlySize = sizes.length === 1 ? sizes[0] : undefined;

  return (
    <div ref={containerRef} onClick={stop}>
      {picking ? (
        <div className="flex flex-wrap items-center justify-center gap-1 bg-kc-ink px-2 py-2">
          {sizes.map(({ size, inStock }) => (
            <button
              key={size}
              type="button"
              disabled={!inStock}
              onClick={() => add(size)}
              aria-label={inStock ? `Add size ${size} to bag` : `Size ${size} is out of stock`}
              className={[
                "min-w-8 px-2 py-1 text-[11px] font-medium uppercase tracking-[0.06em] transition-colors",
                inStock
                  ? "text-kc-paper hover:bg-kc-paper hover:text-kc-ink"
                  : "cursor-not-allowed text-kc-paper/40 line-through",
              ].join(" ")}
            >
              {size}
            </button>
          ))}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => (onlySize ? add(onlySize.size) : setPicking(true))}
          className="block w-full bg-kc-ink py-2.5 text-center text-[11px] font-medium uppercase tracking-[0.08em] text-kc-paper transition-colors hover:bg-kc-charcoal"
        >
          {onlySize ? "Add to bag" : "Quick add"}
        </button>
      )}
    </div>
  );
}
