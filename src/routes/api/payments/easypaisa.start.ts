/**
 * GET /api/payments/easypaisa/start?order=KC-2026-00001
 *
 * Same shape and same guard as the JazzCash equivalent — see the note there
 * for why `payable()` matters on a URL that carries a guessable order number.
 */

import { createFileRoute } from "@tanstack/react-router";

import { autoSubmitForm, payable } from "@/lib/payments/gateway";
import { easypaisaConfigured, easypaisaEndpoint, easypaisaFields } from "@/lib/payments/easypaisa";
import { orderRepository } from "@/lib/repositories";
import { site } from "@/config/site";

function notFound() {
  return new Response("Not found", {
    status: 404,
    headers: { "Cache-Control": "no-store, private" },
  });
}

export const Route = createFileRoute("/api/payments/easypaisa/start")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!easypaisaConfigured()) return notFound();

        const orderNumber = new URL(request.url).searchParams.get("order")?.trim();
        if (!orderNumber) return notFound();

        const page = await orderRepository.listAll({ q: orderNumber, perPage: 5 });
        const order = page.items.find(
          (candidate) => candidate.orderNumber.toLowerCase() === orderNumber.toLowerCase(),
        );

        if (!order || !payable(order)) return notFound();

        const fields = await easypaisaFields(order, site.url);
        return autoSubmitForm(easypaisaEndpoint(), fields, "Easypaisa");
      },
    },
  },
});
