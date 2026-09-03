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

import { useShop } from "@/context/ShopContext";
import { isSoldOut, sizeOptions, toLegacyShopProduct } from "@/lib/legacy-shop-adapter";
import type { Product } from "@/types";

interface ShopSnapshot {
  addToCart: (product: unknown, options?: { size?: string; quantity?: number }) => void;
}

export interface QuickAddButtonProps {
  product: Product;
}

export function QuickAddButton({ product }: QuickAddButtonProps) {
  const shop = useShop() as unknown as ShopSnapshot;
  const [picking, setPicking] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const sizes = sizeOptions(product);
  const soldOut = isSoldOut(product);

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
    shop.addToCart(toLegacyShopProduct(product), { size, quantity: 1 });
    setPicking(false);
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
