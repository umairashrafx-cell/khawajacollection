/**
 * Product grid. See docs/BUILD-SPEC.pdf Section 10.2.
 *
 * Two columns on mobile, three on tablet, four on desktop by default — the
 * mobile count is a deliberate choice, not a squeezed desktop grid (Rule 8).
 */

import type { Product } from "@/types";
import { ProductCard, ProductCardSkeleton } from "./ProductCard";

export interface ProductGridColumns {
  mobile?: 1 | 2;
  tablet?: 2 | 3;
  desktop?: 3 | 4;
}

export interface ProductGridProps {
  products: Product[];
  columns?: ProductGridColumns;
  /** Renders skeletons instead of cards. */
  loading?: boolean;
  /** How many of the first cards are above the fold and load eagerly. */
  priorityCount?: number;
  /** `inverse` for the sale block on ink (Section 11.1 item 9). */
  tone?: "default" | "inverse";
  className?: string;
}

const MOBILE = { 1: "grid-cols-1", 2: "grid-cols-2" } as const;
const TABLET = { 2: "sm:grid-cols-2", 3: "sm:grid-cols-3" } as const;
const DESKTOP = { 3: "lg:grid-cols-3", 4: "lg:grid-cols-4" } as const;

export function ProductGrid({
  products,
  columns,
  loading = false,
  priorityCount = 0,
  tone = "default",
  className = "",
}: ProductGridProps) {
  const gridClass = [
    "grid gap-x-4 gap-y-8 md:gap-x-6 md:gap-y-10",
    MOBILE[columns?.mobile ?? 2],
    TABLET[columns?.tablet ?? 3],
    DESKTOP[columns?.desktop ?? 4],
    className,
  ].join(" ");

  if (loading) {
    return (
      <div className={gridClass}>
        {Array.from({ length: 8 }, (_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className={gridClass}>
      {products.map((product, index) => (
        <ProductCard
          key={product.id}
          product={product}
          priority={index < priorityCount}
          tone={tone}
        />
      ))}
    </div>
  );
}
