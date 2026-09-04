/**
 * The signed-in session. See docs/BUILD-SPEC.pdf Phase 8 item 5 and Section 12.
 *
 * Supabase Auth already persists and refreshes the session; what is missing is
 * a way for React to read it without every component holding its own
 * `useEffect` + `getSession()` pair. So this is the same `useSyncExternalStore`
 * shape the cart and wishlist use, with `onAuthStateChange` as the event
 * source instead of localStorage.
 *
 * HYDRATION. The server has no session — the token lives in browser storage,
 * not a cookie — so the server snapshot is always "signed out, not ready yet"
 * and so is the first client render. `useAuthReady()` is what a component
 * gates on; rendering "Sign in" before the session has loaded and swapping to
 * a name a tick later is a flash, but rendering different markup than the
 * server did is a hydration error, and only one of those is a bug.
 *
 * ROUTE GUARDS ARE NOT THE SECURITY BOUNDARY. Because the session is not on
 * the server, account pages guard themselves in the browser. That hides the
 * page; it does not protect the data. The data is protected by RLS
 * (0002_rls.sql, 0003_accounts.sql) and by the API routes verifying the access
 * token server-side. A visitor who defeats the client guard sees an empty
 * shell, because nothing will answer them.
 */

import { useSyncExternalStore } from "react";
import type { Session, User } from "@supabase/supabase-js";

import { browserClient, isSupabaseConfigured } from "@/lib/supabase/client";

export interface AuthState {
  session: Session | null;
  user: User | null;
  /** False until Supabase has reported the stored session, or its absence. */
  ready: boolean;
}

const SIGNED_OUT: AuthState = { session: null, user: null, ready: false };

/**
 * One object, replaced only when the session actually changes. Returning a
 * fresh object from the snapshot on every read makes useSyncExternalStore
 * re-render forever.
 */
let state: AuthState = SIGNED_OUT;
const listeners = new Set<() => void>();
let started = false;

function publish(session: Session | null, ready = true): void {
  if (state.session?.access_token === session?.access_token && state.ready === ready) return;
  state = { session, user: session?.user ?? null, ready };
  for (const listener of listeners) listener();
}

/**
 * Starts listening on the first subscriber, after mount. Doing this at module
 * scope would run it during SSR, where there is neither storage nor a window.
 */
function start(): void {
  if (started || typeof window === "undefined") return;
  started = true;

  if (!isSupabaseConfigured()) {
    publish(null);
    return;
  }

  const supabase = browserClient();

  // getSession resolves from storage; onAuthStateChange then keeps it current
  // through refreshes, sign-outs and other tabs.
  void supabase.auth.getSession().then(({ data }) => publish(data.session ?? null));
  supabase.auth.onAuthStateChange((_event, session) => publish(session ?? null));
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  start();
  return () => {
    listeners.delete(listener);
  };
}

export function useAuth(): AuthState {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => SIGNED_OUT,
  );
}

export function useUser(): User | null {
  return useSyncExternalStore(
    subscribe,
    () => state.user,
    () => null,
  );
}

export function useAuthReady(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => state.ready,
    () => false,
  );
}

/**
 * The bearer token for calls to our own API routes, which verify it against
 * Supabase server-side before touching an order. Null when signed out.
 */
export function accessToken(): string | null {
  return state.session?.access_token ?? null;
}
