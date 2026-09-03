/**
 * Cart store. See docs/BUILD-SPEC.pdf Sections 8.1, 11.4 and 12.
 *
 * Lines are `CartLine` from src/types, persisted under `kc-cart-v1`, keyed by
 * `productId:variantId` exactly as Section 12 requires — the same product in
 * two sizes is two lines, and adding a size you already hold increments it.
 *
 * THE STORED PRICE IS A DISPLAY VALUE, NOT A SOURCE OF TRUTH. Section 12:
 * "Re-validate prices and stock server-side at checkout — never trust the
 * stored price." A line can sit in localStorage for weeks; Phase 7's order
 * route recomputes every figure from the repository before charging anything.
 */

import { resolvePrice } from "@/lib/format";
import type { CartLine, Product, ProductVariant } from "@/types";
import { createPersistedStore, useHydrated, usePersisted } from "./persisted-store";

const KEY = "kc-cart-v1";
/** One line cannot exceed this, matching the PDP quantity stepper's ceiling. */
const MAX_PER_LINE = 10;

export function lineKey(productId: string, variantId: string): string {
  return `${productId}:${variantId}`;
}

function isLine(value: unknown): value is CartLine {
  if (typeof value !== "object" || value === null) return false;
  const line = value as Record<string, unknown>;
  return (
    typeof line["productId"] === "string" &&
    typeof line["variantId"] === "string" &&
    typeof line["slug"] === "string" &&
    typeof line["name"] === "string" &&
    typeof line["unitPrice"] === "number" &&
    typeof line["quantity"] === "number"
  );
}

const store = createPersistedStore<CartLine[]>({
  key: KEY,
  initial: [],
  parse: (raw) => (Array.isArray(raw) ? raw.filter(isLine) : null),
});

export function addToCart(product: Product, variant: ProductVariant, quantity = 1): void {
  const key = lineKey(product.id, variant.id);
  store.update((lines) => {
    const existing = lines.find((line) => lineKey(line.productId, line.variantId) === key);
    if (existing) {
      return lines.map((line) =>
        lineKey(line.productId, line.variantId) === key
          ? { ...line, quantity: Math.min(MAX_PER_LINE, line.quantity + quantity) }
          : line,
      );
    }

    const image = product.images[0];
    const line: CartLine = {
      productId: product.id,
      variantId: variant.id,
      slug: product.slug,
      name: product.name,
      image: image?.url ?? "",
      size: variant.size,
      colorName: variant.colorName,
      unitPrice: variant.priceOverride ?? resolvePrice(product),
      quantity: Math.min(MAX_PER_LINE, quantity),
    };
    return [...lines, line];
  });
}

export function setQuantity(key: string, quantity: number): void {
  store.update((lines) =>
    quantity <= 0
      ? lines.filter((line) => lineKey(line.productId, line.variantId) !== key)
      : lines.map((line) =>
          lineKey(line.productId, line.variantId) === key
            ? { ...line, quantity: Math.min(MAX_PER_LINE, quantity) }
            : line,
        ),
  );
}

/** Removes a line and returns it, so the caller can offer an undo (Section 11.4). */
export function removeLine(key: string): { line: CartLine; index: number } | null {
  const lines = store.get();
  const index = lines.findIndex((line) => lineKey(line.productId, line.variantId) === key);
  const line = lines[index];
  if (!line) return null;
  store.set(lines.filter((_, i) => i !== index));
  return { line, index };
}

/** Puts a removed line back where it was, for the undo toast. */
export function restoreLine(line: CartLine, index: number): void {
  store.update((lines) => {
    const next = [...lines];
    next.splice(Math.min(index, next.length), 0, line);
    return next;
  });
}

export function clearCart(): void {
  store.set([]);
}

/* --- Reads ---------------------------------------------------------- */

export function useCartLines(): CartLine[] {
  return usePersisted(store, (lines) => lines, EMPTY);
}

const EMPTY: CartLine[] = [];

export function useCartCount(): number {
  return usePersisted(store, (lines) => lines.reduce((n, line) => n + line.quantity, 0), 0);
}

export function useCartSubtotal(): number {
  return usePersisted(
    store,
    (lines) => lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0),
    0,
  );
}

export function useCartHydrated(): boolean {
  return useHydrated(store);
}

/** Non-reactive read, for handlers that need the current lines once. */
export function getCartLines(): CartLine[] {
  return store.get();
}
