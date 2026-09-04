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
    return { id: data.user.id, email: data.user.email };
  } catch {
    // A missing service role key, or Supabase unreachable. Refusing is the
    // only safe answer; degrading to "allow" would be the bug this file exists
    // to prevent.
    return null;
  }
}
