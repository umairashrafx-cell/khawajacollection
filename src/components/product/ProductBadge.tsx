/**
 * The badge stack that sits top-left of a product card.
 * See docs/BUILD-SPEC.pdf Section 10.1.
 *
 * At most two badges, so the image stays the subject. Gold appears only as a
 * hairline border, never as a fill (Section 6.1).
 */

import { discountPercent } from "@/lib/format";
import type { Product } from "@/types";

export type BadgeTone = "neutral" | "sale" | "muted";

export function ProductBadge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: BadgeTone;
}) {
  const tones: Record<BadgeTone, string> = {
    neutral: "border-kc-gold bg-kc-white/95 text-kc-ink",
    sale: "border-transparent bg-kc-sale text-kc-white",
    muted: "border-transparent bg-kc-ink/75 text-kc-white",
  };

  return (
    <span
      className={`border px-2 py-1 text-[10px] font-medium uppercase tracking-[0.08em] leading-none ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function ProductBadgeStack({ product }: { product: Product }) {
  const soldOut = product.variants.every((variant) => variant.stock <= 0);
  const discount = product.salePrice ? discountPercent(product.salePrice, product.price) : null;

  if (soldOut) {
    return (
      <div className="pointer-events-none absolute left-3 top-3 flex flex-col items-start gap-1.5">
        <ProductBadge tone="muted">Sold out</ProductBadge>
      </div>
    );
  }

  if (!product.isNewArrival && discount === null && !product.isMadeToOrder) return null;

  return (
    <div className="pointer-events-none absolute left-3 top-3 flex flex-col items-start gap-1.5">
      {product.isNewArrival ? <ProductBadge>New</ProductBadge> : null}
      {discount !== null ? <ProductBadge tone="sale">-{discount}%</ProductBadge> : null}
      {product.isMadeToOrder && discount === null && !product.isNewArrival ? (
        <ProductBadge>Made to order</ProductBadge>
      ) : null}
    </div>
  );
}
