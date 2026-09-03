/**
 * Order tracking lookup. See docs/BUILD-SPEC.pdf Section 11.6.
 *
 * "Order number + phone or email. Server-side lookup only. Never expose order
 * data from a client query."
 *
 * Both halves are required, and the repository does the matching — there is no
 * endpoint anywhere that lists orders, and no way to enumerate them by trying
 * order numbers alone. A wrong pair returns the same answer as a missing
 * order, so this cannot be used to discover which order numbers exist.
 */

import { createFileRoute } from "@tanstack/react-router";

import { trackOrderSchema } from "@/lib/checkout-schema";
import { orderRepository } from "@/lib/repositories";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

export const Route = createFileRoute("/api/track-order")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let raw: unknown;
        try {
          raw = await request.json();
        } catch {
          return json({ ok: false, error: "Send a JSON body." }, 400);
        }

        const parsed = trackOrderSchema.safeParse(raw);
        if (!parsed.success) {
          return json({ ok: false, error: "Enter both the order number and your contact." }, 400);
        }

        const order = await orderRepository.findForTracking(
          parsed.data.orderNumber,
          parsed.data.contact,
        );

        // Deliberately identical for "no such order" and "wrong contact".
        if (!order) {
          return json(
            {
              ok: false,
              error: "We could not find an order with those details.",
            },
            404,
          );
        }

        // Only what the timeline needs. The full address, email and payment
        // status stay on the server.
        return json({
          ok: true,
          order: {
            orderNumber: order.orderNumber,
            status: order.status,
            createdAt: order.createdAt,
            city: order.shipping.city,
            items: order.items.map((item) => ({
              name: item.nameSnapshot,
              slug: item.slug,
              size: item.size,
              colorName: item.colorName,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
            })),
            totals: order.totals,
          },
        });
      },
    },
  },
});
