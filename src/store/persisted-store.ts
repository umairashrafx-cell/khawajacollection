/**
 * The persistence and subscription mechanics shared by the cart and wishlist.
 * See docs/BUILD-SPEC.pdf Section 12.
 *
 * NOTE ON ZUSTAND. Section 12 specifies Zustand with its persist middleware.
 * `zustand` is not installed and Hard Rule 7 forbids adding a dependency
 * without asking, so this is that contract on React's own
 * `useSyncExternalStore`. It is the same shape Zustand would give — a snapshot,
 * a subscribe, and actions — so swapping the library in later means rewriting
 * this file and nothing else.
 *
 * HYDRATION IS THE WHOLE POINT OF THE DESIGN HERE. Section 12: "persisted
 * stores must not render different markup on server and client". So the server
 * snapshot is always the empty initial state, localStorage is read once after
 * mount, and `useHydrated()` lets a component hold back anything derived from
 * storage until that has happened. Reading storage during render is what
 * produces the intermittent hydration errors the spec warns about.
 */

import { useSyncExternalStore } from "react";

export interface PersistedStore<T> {
  get(): T;
  set(next: T): void;
  update(recipe: (current: T) => T): void;
  subscribe(listener: () => void): () => void;
  /** True once localStorage has been read on the client. */
  isHydrated(): boolean;
}

export function createPersistedStore<T>(options: {
  key: string;
  initial: T;
  /** Rejects anything that is not the expected shape — storage is untrusted. */
  parse: (raw: unknown) => T | null;
}): PersistedStore<T> {
  let state = options.initial;
  let hydrated = false;
  const listeners = new Set<() => void>();

  function emit() {
    for (const listener of listeners) listener();
  }

  function persist() {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(options.key, JSON.stringify(state));
    } catch {
      // Private mode or a full quota. The store keeps working in memory; the
      // alternative is throwing inside a click handler.
    }
  }

  function hydrate() {
    if (hydrated || typeof window === "undefined") return;
    hydrated = true;
    try {
      const raw = window.localStorage.getItem(options.key);
      if (raw) {
        const parsed = options.parse(JSON.parse(raw));
        if (parsed !== null) state = parsed;
      }
    } catch {
      // Corrupt or foreign data under our key — start clean rather than crash.
    }
    emit();
  }

  return {
    get: () => state,
    set(next) {
      state = next;
      persist();
      emit();
    },
    update(recipe) {
      state = recipe(state);
      persist();
      emit();
    },
    subscribe(listener) {
      listeners.add(listener);
      // The first subscriber triggers the one-time read, which happens after
      // mount and so never affects server markup.
      hydrate();
      return () => {
        listeners.delete(listener);
      };
    },
    isHydrated: () => hydrated,
  };
}

/** Subscribes a component to a store, with the empty state as the server snapshot. */
export function usePersisted<T, S>(
  store: PersistedStore<T>,
  select: (state: T) => S,
  serverValue: S,
): S {
  return useSyncExternalStore(
    store.subscribe,
    () => select(store.get()),
    () => serverValue,
  );
}

/**
 * False on the server and on the first client render, true afterwards.
 * Gate anything read from storage — counts, hearts, totals — behind this.
 */
export function useHydrated(store: PersistedStore<unknown>): boolean {
  return useSyncExternalStore(
    store.subscribe,
    () => store.isHydrated(),
    () => false,
  );
}
