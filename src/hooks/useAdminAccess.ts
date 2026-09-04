/**
 * Whether the server will treat this session as an admin.
 *
 * Wraps the /api/admin/whoami call in React Query so the admin layout, the
 * account page's staff link and anything else asking share one cached answer
 * rather than each firing their own request.
 *
 * `useIsAdmin()` in the session store still exists and is still useful for
 * hiding something instantly with no network call — but it reads a claim from
 * a token issued at sign-in, so it goes stale the moment a role changes. Where
 * being WRONG matters, ask this instead.
 */

import { useQuery } from "@tanstack/react-query";

import { fetchAdminAccess } from "@/lib/auth/admin-api";
import { useAuth } from "@/lib/auth/session-store";

export function useAdminAccess(): {
  isAdmin: boolean;
  email: string | null;
  isPending: boolean;
} {
  const { user, ready } = useAuth();

  const { data, isPending } = useQuery({
    queryKey: ["admin-access", user?.id ?? null],
    queryFn: fetchAdminAccess,
    // Nothing to ask about until we know whether anyone is signed in.
    enabled: ready && user !== null,
    // A role change should be picked up promptly, but not on every render.
    staleTime: 30_000,
    retry: false,
  });

  return {
    isAdmin: data?.isAdmin ?? false,
    email: data?.email ?? user?.email ?? null,
    // "Still deciding" while the session loads or the answer is in flight, so
    // the guard can hold rather than flash a refusal at a real admin.
    isPending: !ready || (user !== null && isPending),
  };
}
