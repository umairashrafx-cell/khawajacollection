/**
 * Sign in, register, sign out, forgot and reset password.
 * docs/BUILD-SPEC.pdf Phase 8 item 5: "Supabase Auth for login, register,
 * forgot password".
 *
 * Every action returns `{ ok }` rather than throwing, because every caller is
 * a form that has to put a message next to a field. Supabase's own messages
 * are terse and occasionally leak implementation detail, so they are mapped to
 * something a customer can act on.
 *
 * ON NOT CONFIRMING WHETHER AN EMAIL EXISTS. `requestPasswordReset` reports
 * success whatever happened. Saying "no account with that email" turns the
 * form into a membership oracle for anyone with a list of addresses.
 */

import { browserClient, isSupabaseConfigured } from "@/lib/supabase/client";

export interface AuthResult {
  ok: boolean;
  error?: string;
  /** Set when the account was created but still needs the emailed link. */
  needsEmailConfirmation?: boolean;
}

const UNCONFIGURED =
  "Accounts are not available on this deployment. The catalogue and checkout still work.";

/** Supabase's wording, rewritten for someone standing in a form. */
function readable(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "That email and password do not match.";
  if (m.includes("email not confirmed")) {
    return "Confirm your email first — check your inbox for the link we sent.";
  }
  if (m.includes("user already registered") || m.includes("already been registered")) {
    return "There is already an account with that email. Sign in instead.";
  }
  if (m.includes("password should be at least")) {
    return "Passwords need at least 8 characters.";
  }
  if (m.includes("rate limit") || m.includes("too many")) {
    return "Too many attempts. Wait a minute and try again.";
  }
  return message;
}

export async function signIn(email: string, password: string): Promise<AuthResult> {
  if (!isSupabaseConfigured()) return { ok: false, error: UNCONFIGURED };
  const { error } = await (await browserClient()).auth.signInWithPassword({ email, password });
  return error ? { ok: false, error: readable(error.message) } : { ok: true };
}

export async function register(
  email: string,
  password: string,
  fullName: string,
): Promise<AuthResult> {
  if (!isSupabaseConfigured()) return { ok: false, error: UNCONFIGURED };

  const { data, error } = await (
    await browserClient()
  ).auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${window.location.origin}/account`,
    },
  });

  if (error) return { ok: false, error: readable(error.message) };

  // With email confirmation on, signUp returns a user but no session. The
  // caller has to say "check your inbox" rather than redirect to the account.
  return { ok: true, needsEmailConfirmation: data.session === null };
}

export async function signOut(): Promise<void> {
  if (!isSupabaseConfigured()) return;
  await (await browserClient()).auth.signOut();
}

export async function requestPasswordReset(email: string): Promise<AuthResult> {
  if (!isSupabaseConfigured()) return { ok: false, error: UNCONFIGURED };

  await (
    await browserClient()
  ).auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });

  // Deliberately not surfacing the result — see the note at the top.
  return { ok: true };
}

/** Called from /reset-password, where the emailed link has already signed the visitor in. */
export async function updatePassword(password: string): Promise<AuthResult> {
  if (!isSupabaseConfigured()) return { ok: false, error: UNCONFIGURED };
  const { error } = await (await browserClient()).auth.updateUser({ password });
  return error ? { ok: false, error: readable(error.message) } : { ok: true };
}
