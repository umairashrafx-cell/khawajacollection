/**
 * Price display. See docs/BUILD-SPEC.pdf Sections 6.1, 11.3 and 16.
 *
 * Sale price first, original struck through, discount badge. `--kc-sale` is
 * allowed here and nowhere else. Figures are tabular so a column of prices in
 * a grid lines up.
 */

import { discountPercent, formatPKR } from "@/lib/format";
import type { Product } from "@/types";

export interface PriceBlockProps {
  product: Pick<Product, "price" | "salePrice">;
  size?: "sm" | "lg";
  /**
   * `inverse` is for the sale block, which sits on --kc-ink. --kc-sale on ink
   * is about 2.3:1 and fails Section 15, so the sale price goes to paper there
   * and the red survives only inside a badge, where it is a fill behind white
   * type.
   */
  tone?: "default" | "inverse";
  className?: string;
}

export function PriceBlock({
  product,
  size = "sm",
  tone = "default",
  className = "",
}: PriceBlockProps) {
  const { price, salePrice } = product;
  const discount = salePrice ? discountPercent(salePrice, price) : null;
  const scale = size === "lg" ? "text-lg" : "text-[13px] md:text-sm";
  const inverse = tone === "inverse";

  if (!salePrice) {
    return (
      <p
        className={`kc-price font-semibold ${scale} ${inverse ? "text-kc-paper" : ""} ${className}`}
      >
        {formatPKR(price)}
      </p>
    );
  }

  return (
    <p className={`kc-price flex flex-wrap items-baseline gap-x-2 ${scale} ${className}`}>
      <span className={`font-semibold ${inverse ? "text-kc-paper" : "text-kc-sale"}`}>
        {formatPKR(salePrice)}
      </span>
      <span className={`line-through ${inverse ? "text-kc-paper/60" : "text-kc-muted"}`}>
        {formatPKR(price)}
      </span>
      {discount !== null ? (
        <span
          className={`text-[11px] font-medium ${inverse ? "text-kc-paper/80" : "text-kc-sale"}`}
        >
          -{discount}%
        </span>
      ) : null}
      <span className="sr-only">, reduced from {formatPKR(price)}</span>
    </p>
  );
}
