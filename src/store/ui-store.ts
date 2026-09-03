/**
 * UI store — which overlay is open. See docs/BUILD-SPEC.pdf Section 12.
 *
 * Exactly one of the cart drawer, search modal, mobile nav and filter drawer
 * may be open at a time, so the open overlay is a single value rather than four
 * booleans that can disagree.
 *
 * NOTE ON ZUSTAND. Section 12 specifies Zustand for this store. `zustand` is
 * not installed and Hard Rule 7 forbids adding a dependency without asking, so
 * this is the same contract built on React's own `useSyncExternalStore`:
 * module-level state, no provider, SSR-safe. Phase 6 either keeps it or drops
 * Zustand in behind the same three exports — no component changes either way.
 */

import { useSyncExternalStore } from "react";

export type Overlay = "cart" | "search" | "mobile-nav" | "filters";

let current: Overlay | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): Overlay | null {
  return current;
}

/** The server never has an overlay open, so hydration always agrees. */
function getServerSnapshot(): Overlay | null {
  return null;
}

export function openOverlay(overlay: Overlay): void {
  if (current === overlay) return;
  current = overlay;
  emit();
}

export function closeOverlay(): void {
  if (current === null) return;
  current = null;
  emit();
}

export function toggleOverlay(overlay: Overlay): void {
  if (current === overlay) closeOverlay();
  else openOverlay(overlay);
}

/** The overlay currently open, or null. */
export function useOverlay(): Overlay | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useIsOverlayOpen(overlay: Overlay): boolean {
  return useOverlay() === overlay;
}
