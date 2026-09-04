/**
 * Keeping the guest wishlist and the account wishlist in step.
 * docs/BUILD-SPEC.pdf Phase 8 item 5 and Section 11.6:
 *
 *   "guests get a localStorage list; on login, merge the local list into the
 *    account list rather than overwriting."
 *
 * MERGE, NEVER OVERWRITE, IN BOTH DIRECTIONS. The obvious implementations are
 * both wrong. Pulling the account list over the local one loses whatever the
 * visitor saved before signing in — which is usually the very thing that made
 * them sign in. Pushing the local list over the account one loses everything
 * they saved on their phone. So login takes the union, and only after that
 * does the store become authoritative for later changes.
 *
 * This talks to `wishlists` through the *authenticated* browser client, not
 * the service role: 0002_rls.sql already restricts every row to
 * `auth.uid() = user_id`, so the database enforces the boundary and there is
 * no server route to get wrong. It is the one place in the app where RLS is
 * doing the whole job on its own.
 */

import { browserClient, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  getWishlistSnapshot,
  mergeInto,
  subscribeToWishlist,
  type WishlistEntry,
} from "@/store/wishlist-store";

interface RemoteEntry {
  productId: string;
  slug: string;
  name: string;
  image: string;
  alt: string;
  price: number;
}

async function remoteIds(userId: string): Promise<string[]> {
  const { data, error } = await browserClient()
    .from("wishlists")
    .select("product_id")
    .eq("user_id", userId);

  if (error) return [];
  return ((data ?? []) as { product_id: string }[]).map((row) => row.product_id);
}

/** Bare ids from the account become the snapshot shape the wishlist page renders. */
async function hydrate(ids: string[]): Promise<WishlistEntry[]> {
  if (ids.length === 0) return [];

  const response = await fetch(`/api/wishlist-entries?ids=${encodeURIComponent(ids.join(","))}`);
  if (!response.ok) return [];

  const body = (await response.json()) as { entries?: RemoteEntry[] };
  const now = new Date().toISOString();
  return (body.entries ?? []).map((entry) => ({ ...entry, addedAt: now }));
}

/** Replaces the account's rows with `ids`, in one round trip each way. */
async function pushAll(userId: string, ids: string[]): Promise<void> {
  const supabase = browserClient();

  if (ids.length > 0) {
    // Composite primary key (user_id, product_id), so re-saving something is a
    // no-op rather than a duplicate-key error.
    await supabase.from("wishlists").upsert(
      ids.map((productId) => ({ user_id: userId, product_id: productId })),
      { onConflict: "user_id,product_id", ignoreDuplicates: true },
    );
  }

  // Anything the customer removed since the merge. `not.in` on an empty list
  // is invalid PostgREST, so a cleared wishlist deletes everything instead.
  const query = supabase.from("wishlists").delete().eq("user_id", userId);
  await (ids.length > 0 ? query.not("product_id", "in", `(${ids.join(",")})`) : query);
}

let stopMirror: (() => void) | null = null;

/**
 * Called once when a session appears. Merges both ways, then mirrors every
 * later change up to the account for as long as the session lasts.
 */
export async function syncWishlistOnLogin(userId: string): Promise<void> {
  if (!isSupabaseConfigured()) return;

  stopMirror?.();

  const ids = await remoteIds(userId);
  const known = new Set(getWishlistSnapshot().map((entry) => entry.productId));
  const incoming = await hydrate(ids.filter((id) => !known.has(id)));

  // The union. mergeInto keeps everything already local and appends the rest.
  const merged = mergeInto(incoming);
  await pushAll(
    userId,
    merged.map((entry) => entry.productId),
  );

  let pending: ReturnType<typeof setTimeout> | null = null;
  stopMirror = subscribeToWishlist(() => {
    // Toggling a heart three times in a second should be one write, not three.
    if (pending) clearTimeout(pending);
    pending = setTimeout(() => {
      void pushAll(
        userId,
        getWishlistSnapshot().map((entry) => entry.productId),
      );
    }, 400);
  });
}

/**
 * On sign-out the local list is left exactly as it is. It is now a guest list
 * again, which is what it was before signing in — deleting it would punish
 * someone for logging out on a shared machine, and the account keeps its own
 * copy regardless.
 */
export function stopWishlistSync(): void {
  stopMirror?.();
  stopMirror = null;
}
