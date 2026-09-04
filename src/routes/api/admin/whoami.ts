/**
 * "Does the server consider me an admin?"
 *
 * WHY THIS EXISTS. The admin guard used to read the role out of the session
 * the browser was holding, and that session is a snapshot taken at sign-in.
 * Granting someone admin in Supabase does not change a token that has already
 * been issued, so a freshly-promoted admin saw "Not an admin account" until
 * their token happened to refresh — while every /api/admin endpoint would have
 * served them perfectly well. The UI contradicted the server and gave no way
 * to find out why.
 *
 * This endpoint is the authority the UI asks instead. It is deliberately tiny:
 * no orders, no catalogue, just a yes or no plus the email it belongs to, so
 * the guard costs one cheap request rather than a page of data it might not be
 * allowed to show.
 *
 * `adminFromRequest` reads the user record from Supabase rather than the
 * token's claims, so a grant takes effect on the next request and a revocation
 * does too.
 */

import { createFileRoute } from "@tanstack/react-router";

import { adminFromRequest, userFromRequest } from "@/lib/auth/verify";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store, private" },
  });
}

export const Route = createFileRoute("/api/admin/whoami")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const admin = await adminFromRequest(request);
        if (admin) return json({ ok: true, isAdmin: true, email: admin.email ?? null });

        // Distinguishing "signed in but not staff" from "not signed in at all"
        // is what lets the guard say something useful instead of one blank
        // refusal for two different problems.
        const user = await userFromRequest(request);
        return json({ ok: true, isAdmin: false, email: user?.email ?? null }, 200);
      },
    },
  },
});
