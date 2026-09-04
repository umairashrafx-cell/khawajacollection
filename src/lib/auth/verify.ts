/**
 * Server-side identity. docs/BUILD-SPEC.pdf Phase 8, Guardrail 4.
 *
 * The browser holds an access token; a server route needs to know who that
 * token belongs to before it reads anyone's orders. This asks Supabase, which
 * is the only party that can answer — the token is signed by Supabase, and
 * anything short of asking is guesswork.
 *
 * WHY NOT DECODE THE JWT LOCALLY. A JWT's payload is base64, not a proof. A
 * caller can put any `sub` they like in one and send it. Reading it without
 * checking the signature would turn "who are you" into "who do you say you
 * are", which for an order-history endpoint means handing over strangers'
 * delivery addresses. The round trip is worth it.
 */

import { serviceClient } from "@/lib/supabase/client";

export interface VerifiedUser {
  id: string;
  email: string | undefined;
  /** True only when Supabase says so — see isAdmin below. */
  isAdmin: boolean;
}

/**
 * WHY THE ROLE LIVES IN `app_metadata` AND NOT `user_metadata`.
 *
 * A signed-in user can write their own `user_metadata` — that is what the
 * account page uses to store a display name. If the admin flag lived there,
 * any customer could call `updateUser({ data: { role: "admin" } })` and
 * promote themselves. `app_metadata` is writable only with the service role
 * or from the Supabase dashboard, which is exactly the friction granting
 * admin should have.
 *
 * This is read from the user record Supabase returns for the token, not from
 * the token's own claims, so revoking admin takes effect on the next request
 * rather than whenever the customer's session happens to refresh.
 *
 * To grant it:
 *   update auth.users
 *      set raw_app_meta_data = raw_app_meta_data || '{"role":"admin"}'
 *    where email = 'you@example.com';
 */
function isAdmin(appMetadata: Record<string, unknown> | undefined): boolean {
  return appMetadata?.["role"] === "admin";
}

/**
 * The user behind an `Authorization: Bearer <token>` header, or null when the
 * header is missing, malformed, expired or forged. Callers must treat null as
 * "no", never as "probably fine".
 */
export async function userFromRequest(request: Request): Promise<VerifiedUser | null> {
  const header = request.headers.get("authorization") ?? request.headers.get("Authorization");
  if (!header?.toLowerCase().startsWith("bearer ")) return null;

  const token = header.slice(7).trim();
  if (!token) return null;

  try {
    const { data, error } = await (await serviceClient()).auth.getUser(token);
    if (error || !data.user) return null;
    return {
      id: data.user.id,
      email: data.user.email,
      isAdmin: isAdmin(data.user.app_metadata as Record<string, unknown> | undefined),
    };
  } catch {
    // A missing service role key, or Supabase unreachable. Refusing is the
    // only safe answer; degrading to "allow" would be the bug this file exists
    // to prevent.
    return null;
  }
}

/**
 * The admin behind a request, or null.
 *
 * Separate from `userFromRequest` on purpose. Every admin endpoint calls this
 * one, so “is this person allowed to change an order's status” has exactly one
 * answer in the codebase rather than a check each route remembers to write.
 * Forgetting it is the whole class of bug an admin panel invites.
 */
export async function adminFromRequest(request: Request): Promise<VerifiedUser | null> {
  const user = await userFromRequest(request);
  return user?.isAdmin ? user : null;
}
