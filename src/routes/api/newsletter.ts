/**
 * Newsletter sign-up endpoint. See docs/BUILD-SPEC.pdf Section 9 and 11.1.
 *
 * Validates server-side and never trusts the client. It does NOT yet persist
 * anything: there is no mailing-list provider configured and Guardrail 2
 * forbids inventing one. Phase 8 writes subscribers to Supabase; until then a
 * signed-up address is logged on the server and goes no further.
 *
 * TODO(Phase 8): persist to a `subscribers` table and dedupe on email.
 */

import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const payloadSchema = z.object({
  email: z.string().trim().min(1).email().max(254),
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const Route = createFileRoute("/api/newsletter")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let raw: unknown;
        try {
          raw = await request.json();
        } catch {
          return json({ ok: false, error: "Send a JSON body." }, 400);
        }

        const parsed = payloadSchema.safeParse(raw);
        if (!parsed.success) {
          return json({ ok: false, error: "Enter a valid email address." }, 400);
        }

        // Not persisted yet — see the TODO above. Logged so a sign-up during
        // the prototype phase is at least recoverable from server output.
        console.info(`[newsletter] sign-up (not persisted): ${parsed.data.email}`);

        return json({ ok: true });
      },
    },
  },
});
