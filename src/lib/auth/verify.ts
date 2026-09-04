/**
 * Server-side identity and staff membership.
 * docs/BUILD-SPEC.pdf Phase 8, Guardrail 4.
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
 *
 * WHY THIS USES THE PUBLISHABLE KEY, NOT THE SERVICE ROLE. Verifying a token
 * and reading the caller's own admin row both work perfectly well as the
 * caller. Using the service role would have made sign-in verification depend
 * on a server-only secret that is easy to forget on a new deployment, and the
 * failure mode is "nobody is an admin" with nothing on screen to say why.
 * Less privilege, fewer ways to break.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import { isSupabaseConfigured, supabaseUrl } from "@/lib/supabase/client";

export interface VerifiedUser {
  id: string;
  email: string | undefined;
  /** True only when a row exists in `admins` — see the note on isAdmin below. */
  isAdmin: boolean;
}

type SupabaseModule = typeof import("@supabase/supabase-js");

let modulePromise: Promise<SupabaseModule> | null = null;

function loadSupabase(): Promise<SupabaseModule> {
  modulePromise ??= import("@supabase/supabase-js");
  return modulePromise;
}

/**
 * A client that acts as the caller, so RLS applies to it exactly as it would
 * in their browser. Built per request because it carries their token.
 */
async function clientForToken(token: string): Promise<SupabaseClient> {
  const { createClient } = await loadSupabase();
  return createClient(supabaseUrl(), import.meta.env.VITE_SUPABASE_ANON_KEY ?? "", {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}

function bearer(request: Request): string | null {
  const header = request.headers.get("authorization") ?? request.headers.get("Authorization");
  if (!header?.toLowerCase().startsWith("bearer ")) return null;
  const token = header.slice(7).trim();
  return token || null;
}

/**
 * WHY STAFF LIVE IN AN `admins` TABLE AND NOT IN `app_metadata`.
 *
 * The first version stored `{"role":"admin"}` in
 * `auth.users.raw_app_meta_data`, on the reasoning that a customer can write
 * their own `user_metadata` but not their `app_metadata`. The reasoning was
 * right; the storage was not. GoTrue REWRITES `raw_app_meta_data` on sign-in,
 * resetting it to `{provider, providers}` — so a grant survived until the new
 * admin signed in and then silently disappeared. It happened twice on this
 * project before it was understood, and the advice that caused it ("sign out
 * and back in to pick up the role") was the very thing destroying it.
 *
 * `admins` is our table and the auth server never touches it, so a grant lasts
 * until someone deletes the row. The security property is unchanged:
 * 0004_admins.sql gives it a select-your-own-row policy and NO write policy at
 * all, so promoting someone still requires the service role or the SQL editor.
 */
async function isAdmin(supabase: SupabaseClient, userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) return false;
  return data !== null;
}

/**
 * The user behind an `Authorization: Bearer <token>` header, or null when the
 * header is missing, malformed, expired or forged. Callers must treat null as
 * "no", never as "probably fine".
 */
export async function userFromRequest(request: Request): Promise<VerifiedUser | null> {
  const token = bearer(request);
  if (!token || !isSupabaseConfigured()) return null;

  try {
    const supabase = await clientForToken(token);

    // Validates the signature and expiry against Supabase. A forged token
    // fails here, whatever it claims.
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return null;

    return {
      id: data.user.id,
      email: data.user.email,
      isAdmin: await isAdmin(supabase, data.user.id),
    };
  } catch {
    // Supabase unreachable, or misconfigured. Refusing is the only safe
    // answer; degrading to "allow" would be the bug this file exists to
    // prevent.
    return null;
  }
}

/**
 * The admin behind a request, or null.
 *
 * Separate from `userFromRequest` on purpose. Every admin endpoint calls this
 * one, so "is this person allowed to change an order's status" has exactly one
 * answer in the codebase rather than a check each route remembers to write.
 * Forgetting it is the whole class of bug an admin panel invites.
 */
export async function adminFromRequest(request: Request): Promise<VerifiedUser | null> {
  const user = await userFromRequest(request);
  return user?.isAdmin ? user : null;
}
