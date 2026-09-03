/**
 * Screen-reader announcements. See docs/BUILD-SPEC.pdf Section 15:
 * "Cart and wishlist changes announce via an aria-live='polite' region, not
 * only a toast."
 *
 * A toast is a visual affordance. Sonner does not reliably put its text into a
 * live region a screen reader will read at the right moment, so cart and
 * wishlist changes announce here as well — one polite region, mounted once in
 * the root layout.
 */

import { useSyncExternalStore } from "react";

export interface Announcement {
  message: string;
  /** Bumped on every announce so repeating the same sentence still fires. */
  version: number;
}

const EMPTY: Announcement = { message: "", version: 0 };

// One object, replaced only when something is announced. useSyncExternalStore
// compares snapshots by identity, so building a fresh object per read would
// loop forever.
let snapshot: Announcement = EMPTY;
const listeners = new Set<() => void>();

export function announce(message: string): void {
  snapshot = { message, version: snapshot.version + 1 };
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useAnnouncement(): Announcement {
  return useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => EMPTY,
  );
}
