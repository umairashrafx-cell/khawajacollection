/**
 * Runs the wishlist merge when a session appears, and stops mirroring when it
 * goes away. docs/BUILD-SPEC.pdf Phase 8 item 5.
 *
 * Hard Rule 3 puts data fetching in route loaders rather than effects, and
 * this is deliberately outside that rule rather than an exception to it. The
 * trigger is not a navigation — it is a session arriving, which can happen on
 * any route, in another tab, or when a token refreshes. There is no loader to
 * hang that on. Nothing rendered depends on the result either: the wishlist
 * store updates and the components already subscribed to it re-render on
 * their own.
 *
 * Mounted once in __root so signing in from anywhere merges immediately.
 */

import { useEffect } from "react";

import { useUser } from "@/lib/auth/session-store";
import { stopWishlistSync, syncWishlistOnLogin } from "@/lib/auth/wishlist-sync";

export function useAccountSync(): void {
  const userId = useUser()?.id ?? null;

  useEffect(() => {
    if (!userId) {
      stopWishlistSync();
      return;
    }

    void syncWishlistOnLogin(userId);
    return () => stopWishlistSync();
  }, [userId]);
}
