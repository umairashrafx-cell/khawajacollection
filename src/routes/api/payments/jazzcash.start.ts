/**
 * GET /api/payments/jazzcash/start?order=KC-2026-00001
 *
 * Renders the signed form and posts the customer to JazzCash. Nothing here is
 * secret to the customer — they are about to send it themselves — but the
 * merchant password and the hash are computed on this side of the wire and
 * never reach any bundle.
 *
 * THE GUARD IS NOT DECORATIVE. The order number is in a URL and order numbers
 * are sequential, so without `payable()` this endpoint would tell a stranger
 * which orders exist, what they cost, and would let them re-open a payment for
 * one already settled. It answers 404 for anything not currently awaiting
 * payment, which is the same answer it gives for an order that does not exist.
 */

import { createFileRoute } from "@tanstack/react-router";

import { autoSubmitForm, payable } from "@/lib/payments/gateway";
import { jazzcashConfigured, jazzcashEndpoint, jazzcashFields } from "@/lib/payments/jazzcash";
import { orderRepository } from "@/lib/repositories";
import { site } from "@/config/site";

function notFound() {
  return new Response("Not found", {
    status: 404,
    headers: { "Cache-Control": "no-store, private" },
  });
}

export const Route = createFileRoute("/api/payments/jazzcash/start")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!jazzcashConfigured()) return notFound();

        const orderNumber = new URL(request.url).searchParams.get("order")?.trim();
        if (!orderNumber) return notFound();

        // The unscoped read is deliberate and safe here: nothing from the
        // order reaches the response except the amount the customer is about
        // to be shown by JazzCash anyway. No address, no phone, no email.
        const page = await orderRepository.listAll({ q: orderNumber, perPage: 5 });
        const order = page.items.find(
          (candidate) => candidate.orderNumber.toLowerCase() === orderNumber.toLowerCase(),
        );

        if (!order || !payable(order)) return notFound();

        const fields = await jazzcashFields(order, site.url);
        return autoSubmitForm(jazzcashEndpoint(), fields, "JazzCash");
      },
    },
  },
});
