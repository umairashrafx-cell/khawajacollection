/**
 * Bridges a spec `Product` (Section 8.1) onto the shape the Lovable-era
 * ShopContext stores in the cart and wishlist.
 *
 * TEMPORARY. Phase 6 replaces ShopContext with typed cart and wishlist stores
 * that speak `CartLine` directly, and this file goes with it. Until then the
 * prototype cart drawer, wishlist page and checkout keep working against the
 * new catalogue instead of being rewritten mid-phase.
 */

import { resolvePrice } from "@/lib/format";
import type { Product } from "@/types";

export interface LegacyShopProduct {
  id: string;
  slug: string;
  name: string;
  /** Resolved: salePrice ?? price, so the drawer never shows a stale figure. */
  price: number;
  /** The legacy store expects plain URL strings, not ProductImage objects. */
  images: string[];
}

export function toLegacyShopProduct(product: Product): LegacyShopProduct {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    price: resolvePrice(product),
    images: product.images.map((image) => image.url),
  };
}

/** Distinct sizes for a product, in variant order, with availability. */
export function sizeOptions(product: Product): { size: string; inStock: boolean }[] {
  const seen = new Map<string, boolean>();
  for (const variant of product.variants) {
    seen.set(variant.size, (seen.get(variant.size) ?? false) || variant.stock > 0);
  }
  return [...seen.entries()].map(([size, inStock]) => ({ size, inStock }));
}

export function isSoldOut(product: Product): boolean {
  return product.variants.every((variant) => variant.stock <= 0);
}
