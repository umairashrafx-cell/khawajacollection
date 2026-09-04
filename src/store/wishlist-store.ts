/**
 * Wishlist store. See docs/BUILD-SPEC.pdf Sections 11.6 and 12.
 *
 * Guest list in localStorage under `kc-wishlist-v1`. Section 11.6: on login the
 * local list is MERGED into the account list, never overwritten — `mergeInto`
 * exists for Phase 8 to call with the server's list.
 *
 * Entries carry a small snapshot rather than a bare id for the same reason
 * Recently Viewed does: the wishlist page has to render without shipping the
 * catalogue to the browser. The PDP link is always authoritative for price.
 */

import { resolvePrice } from "@/lib/format";
import type { Product } from "@/types";
import { createPersistedStore, useHydrated, usePersisted } from "./persisted-store";

const KEY = "kc-wishlist-v1";

export interface WishlistEntry {
  productId: string;
  slug: string;
  name: string;
  image: string;
  alt: string;
  price: number;
  addedAt: string;
}

function isEntry(value: unknown): value is WishlistEntry {
  if (typeof value !== "object" || value === null) return false;
  const entry = value as Record<string, unknown>;
  return (
    typeof entry["productId"] === "string" &&
    typeof entry["slug"] === "string" &&
    typeof entry["name"] === "string" &&
    typeof entry["price"] === "number"
  );
}

const store = createPersistedStore<WishlistEntry[]>({
  key: KEY,
  initial: [],
  parse: (raw) => (Array.isArray(raw) ? raw.filter(isEntry) : null),
});

function toEntry(product: Product): WishlistEntry {
  const image = product.images[0];
  return {
    productId: product.id,
    slug: product.slug,
    name: product.name,
    image: image?.url ?? "",
    alt: image?.alt ?? product.name,
    price: resolvePrice(product),
    addedAt: new Date().toISOString(),
  };
}

/** Returns true when the product ended up saved, false when it was removed. */
export function toggleWishlist(product: Product): boolean {
  const exists = store.get().some((entry) => entry.productId === product.id);
  store.update((entries) =>
    exists
      ? entries.filter((entry) => entry.productId !== product.id)
      : [toEntry(product), ...entries],
  );
  return !exists;
}

export function removeFromWishlist(productId: string): void {
  store.update((entries) => entries.filter((entry) => entry.productId !== productId));
}

/**
 * Section 11.6 — merge, never overwrite. Phase 8 calls this with the account's
 * saved list on login; anything saved as a guest survives.
 */
export function mergeInto(remote: WishlistEntry[]): WishlistEntry[] {
  const merged = [...store.get()];
  for (const entry of remote) {
    if (!merged.some((existing) => existing.productId === entry.productId)) merged.push(entry);
  }
  store.set(merged);
  return merged;
}

/**
 * Non-reactive access, for the Supabase mirror in src/lib/auth/wishlist-sync.ts.
 * Components must use the hooks below instead — these read outside React and
 * so will not re-render anything.
 */
export function getWishlistSnapshot(): WishlistEntry[] {
  return store.get();
}

export function subscribeToWishlist(listener: () => void): () => void {
  return store.subscribe(listener);
}

/* --- Reads ---------------------------------------------------------- */

const EMPTY: WishlistEntry[] = [];

export function useWishlist(): WishlistEntry[] {
  return usePersisted(store, (entries) => entries, EMPTY);
}

export function useWishlistCount(): number {
  return usePersisted(store, (entries) => entries.length, 0);
}

export function useIsWishlisted(productId: string): boolean {
  return usePersisted(
    store,
    (entries) => entries.some((entry) => entry.productId === productId),
    false,
  );
}

export function useWishlistHydrated(): boolean {
  return useHydrated(store);
}
