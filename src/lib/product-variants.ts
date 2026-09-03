/**
 * Variant selection for the PDP. See docs/BUILD-SPEC.pdf Sections 8.1 and 11.3.
 *
 * A product's variants are the cross product of its colours and sizes, so the
 * PDP needs to answer three questions: which colours exist, which sizes exist
 * for the chosen colour, and which single variant a colour plus size resolves
 * to. Availability is never hidden — an unavailable size stays in the run,
 * struck through and disabled (Section 10.2).
 */

import type { Product, ProductVariant } from "@/types";

export interface ColorOption {
  name: string;
  hex: string;
  /** False when every size in this colour is out of stock. */
  hasStock: boolean;
}

export interface SizeOption {
  size: string;
  inStock: boolean;
  variantId: string | null;
}

/** Distinct colours in variant order, each flagged with whether any size is left. */
export function colorOptions(product: Product): ColorOption[] {
  const byName = new Map<string, ColorOption>();
  for (const variant of product.variants) {
    const existing = byName.get(variant.colorName);
    if (existing) {
      existing.hasStock = existing.hasStock || variant.stock > 0;
    } else {
      byName.set(variant.colorName, {
        name: variant.colorName,
        hex: variant.colorHex,
        hasStock: variant.stock > 0,
      });
    }
  }
  return [...byName.values()];
}

/**
 * The full size run for a colour. Sizes the product sells in another colour
 * still appear, marked unavailable, so the run does not change shape as
 * colours are clicked.
 */
export function sizesForColor(product: Product, colorName: string | null): SizeOption[] {
  const allSizes: string[] = [];
  for (const variant of product.variants) {
    if (!allSizes.includes(variant.size)) allSizes.push(variant.size);
  }

  return allSizes.map((size) => {
    const variant = product.variants.find(
      (candidate) =>
        candidate.size === size && (colorName === null || candidate.colorName === colorName),
    );
    return {
      size,
      inStock: (variant?.stock ?? 0) > 0,
      variantId: variant?.id ?? null,
    };
  });
}

export function findVariant(
  product: Product,
  colorName: string | null,
  size: string | null,
): ProductVariant | null {
  if (!colorName || !size) return null;
  return (
    product.variants.find(
      (variant) => variant.colorName === colorName && variant.size === size,
    ) ?? null
  );
}

/** The colour to select on first render: the first one with stock, else the first. */
export function defaultColor(product: Product): string | null {
  const colors = colorOptions(product);
  return (colors.find((color) => color.hasStock) ?? colors[0])?.name ?? null;
}

/**
 * The size to select on first render. A single-size product (unstitched, one
 * size) preselects it; a real size run waits for a deliberate choice, because
 * guessing someone's size is worse than asking.
 */
export function defaultSize(product: Product, colorName: string | null): string | null {
  const sizes = sizesForColor(product, colorName);
  if (sizes.length === 1) return sizes[0]?.size ?? null;
  return null;
}

export function totalStock(product: Product): number {
  return product.variants.reduce((sum, variant) => sum + variant.stock, 0);
}

/** The price a variant is actually sold at (Section 8.1, priceOverride). */
export function variantPrice(product: Product, variant: ProductVariant | null): number {
  if (variant?.priceOverride !== undefined) return variant.priceOverride;
  return product.salePrice ?? product.price;
}
