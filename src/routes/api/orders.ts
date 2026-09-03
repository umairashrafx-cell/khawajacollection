/**
 * Order creation. See docs/BUILD-SPEC.pdf Section 11.5 and Guardrail 5.
 *
 * "Order creation happens in a server route, never from the client. Recompute
 * every price server-side from the repository — never trust client totals."
 *
 * So the request carries only productId, variantId and quantity. Every price,
 * every line total, the subtotal, the shipping and the grand total are read
 * from the repository here. A client that sends prices has them ignored; a
 * client that tampers with them changes nothing.
 *
 * Stock is checked at the same moment, because a basket can sit in
 * localStorage for weeks and the last piece may be gone.
 */

import { createFileRoute } from "@tanstack/react-router";

import { commerce } from "@/config/site";
import { orderRequestSchema } from "@/lib/checkout-schema";
import { getPaymentProvider } from "@/lib/payments";
import { orderRepository, productRepository } from "@/lib/repositories";
import type { OrderDraft, OrderItem, OrderTotals, ShippingAddress } from "@/types";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const Route = createFileRoute("/api/orders")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let raw: unknown;
        try {
          raw = await request.json();
        } catch {
          return json({ ok: false, error: "Send a JSON body." }, 400);
        }

        const parsed = orderRequestSchema.safeParse(raw);
        if (!parsed.success) {
          return json(
            {
              ok: false,
              error: "Some details need checking.",
              issues: parsed.error.issues.map((issue) => ({
                path: issue.path.join("."),
                message: issue.message,
              })),
            },
            400,
          );
        }

        const input = parsed.data;

        // Section 11.5 — only Cash on Delivery is live. Anything else is
        // refused here as well as being disabled in the UI, because the UI is
        // not a security boundary.
        const provider = getPaymentProvider(input.paymentMethod);
        if (!provider.isEnabled) {
          return json({ ok: false, error: `${provider.label} is not available yet.` }, 400);
        }

        /* --- Price everything from the repository ---------------------- */

        const items: OrderItem[] = [];
        for (const line of input.items) {
          // Resolved from the catalogue, so a stale or invented id cannot
          // enter an order.
          const product = await productRepository.getById(line.productId);
          if (!product) {
            return json({ ok: false, error: "One of these pieces is no longer available." }, 409);
          }

          const variant = product.variants.find((candidate) => candidate.id === line.variantId);
          if (!variant) {
            return json(
              { ok: false, error: `That size of ${product.name} is no longer available.` },
              409,
            );
          }
          if (variant.stock < line.quantity) {
            return json(
              {
                ok: false,
                error:
                  variant.stock === 0
                    ? `${product.name} in size ${variant.size} has sold out.`
                    : `Only ${variant.stock} left of ${product.name} in size ${variant.size}.`,
              },
              409,
            );
          }

          items.push({
            productId: product.id,
            variantId: variant.id,
            nameSnapshot: product.name,
            slug: product.slug,
            size: variant.size,
            colorName: variant.colorName,
            // The authoritative price: variant override, else sale, else list.
            unitPrice: variant.priceOverride ?? product.salePrice ?? product.price,
            quantity: line.quantity,
          });
        }

        const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
        const qualifiesForFreeDelivery = subtotal >= commerce.freeDeliveryThreshold;

        // Guardrail 2: the flat rate is a TODO in config. Rather than invent a
        // number, an order that would need one is refused.
        if (!qualifiesForFreeDelivery && commerce.flatShippingRate === null) {
          return json(
            {
              ok: false,
              error:
                "Delivery charges are not configured yet. Orders over " +
                `PKR ${commerce.freeDeliveryThreshold.toLocaleString("en-PK")} ` +
                "can be placed today.",
            },
            503,
          );
        }

        const totals: OrderTotals = {
          subtotal,
          shipping: qualifiesForFreeDelivery ? 0 : (commerce.flatShippingRate ?? 0),
          discount: 0,
          total: subtotal + (qualifiesForFreeDelivery ? 0 : (commerce.flatShippingRate ?? 0)),
        };

        /* --- Create ---------------------------------------------------- */

        const shipping: ShippingAddress = {
          name: input.name,
          line1: input.line1,
          ...(input.line2 ? { line2: input.line2 } : {}),
          city: input.city,
          province: input.province as ShippingAddress["province"],
          ...(input.postalCode ? { postalCode: input.postalCode } : {}),
          ...(input.notes ? { notes: input.notes } : {}),
        };

        const draft: OrderDraft = {
          ...(input.email ? { email: input.email } : {}),
          phone: input.phone,
          shipping,
          items: input.items,
          paymentMethod: input.paymentMethod,
        };

        const initiated = await provider.initiate(draft);
        if (!initiated.ok) {
          return json({ ok: false, error: initiated.message ?? "Payment could not start." }, 400);
        }

        const order = await orderRepository.create({ draft, items, totals });

        return json({
          ok: true,
          orderNumber: order.orderNumber,
          total: order.totals.total,
          paymentMessage: initiated.message,
        });
      },
    },
  },
});
