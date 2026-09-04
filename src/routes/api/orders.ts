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
 * Stock is RESERVED at the same moment, because a basket can sit in
 * localStorage for weeks and the last piece may be gone.
 *
 * "Reserved", not "checked". The first version read the stock, refused the
 * order if it was too low, and never wrote the number back — so the same last
 * piece could be sold to an unlimited number of customers and the stock screen
 * went on calling it available. It was found by placing the first real order
 * end to end: every field was right and the count did not move.
 *
 * The fix is one atomic operation per line (see `reserveStock`), and a
 * rollback if any part of the order fails afterwards. Checking and then
 * subtracting would still be two statements with a gap in the middle.
 */

import { createFileRoute } from "@tanstack/react-router";

import { userFromRequest } from "@/lib/auth/verify";
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

        /*
         * Anything reserved so far, so a failure part-way can put it back.
         * A basket of three where the third is sold out must not silently
         * consume the first two.
         */
        const reserved: { variantId: string; quantity: number }[] = [];
        const releaseAll = async () => {
          for (const held of reserved) {
            await productRepository.releaseStock(held.variantId, held.quantity);
          }
        };

        const items: OrderItem[] = [];
        for (const line of input.items) {
          // Resolved from the catalogue, so a stale or invented id cannot
          // enter an order.
          const product = await productRepository.getById(line.productId);
          if (!product) {
            await releaseAll();
            return json({ ok: false, error: "One of these pieces is no longer available." }, 409);
          }

          const variant = product.variants.find((candidate) => candidate.id === line.variantId);
          if (!variant) {
            await releaseAll();
            return json(
              { ok: false, error: `That size of ${product.name} is no longer available.` },
              409,
            );
          }

          // The stock check and the stock write are the SAME operation. Null
          // means it could not be taken — either sold out, or someone else got
          // there between this request reading the catalogue and reaching here.
          const remaining = await productRepository.reserveStock(variant.id, line.quantity);
          if (remaining === null) {
            await releaseAll();
            // Re-read rather than quoting the stale number the catalogue gave
            // us; by now it may have changed again, and "only 2 left" when
            // there are none is worse than saying nothing useful.
            const fresh = await productRepository.getById(line.productId);
            const now = fresh?.variants.find((c) => c.id === line.variantId)?.stock ?? 0;
            return json(
              {
                ok: false,
                error:
                  now === 0
                    ? `${product.name} in size ${variant.size} has sold out.`
                    : `Only ${now} left of ${product.name} in size ${variant.size}.`,
              },
              409,
            );
          }
          reserved.push({ variantId: variant.id, quantity: line.quantity });

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
          await releaseAll();
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
          await releaseAll();
          return json({ ok: false, error: initiated.message ?? "Payment could not start." }, 400);
        }

        // Guest checkout stays first-class: an unverified or absent token
        // means the order is simply not attached to an account, never that
        // the order is refused. Attaching it to whatever id the client
        // claimed would be worse than not attaching it at all, so the token
        // is verified server-side or ignored.
        const buyer = await userFromRequest(request);

        // The repository can fail for reasons the shopper cannot act on: the
        // database unreachable, a missing service role key, a migration not
        // applied. Letting that escape renders the framework's crash page over
        // a filled-in checkout form, which loses the basket and says nothing.
        // A 503 with a sentence keeps the form and tells them to try again.
        let order;
        try {
          order = await orderRepository.create({
            draft,
            items,
            totals,
            ...(buyer ? { userId: buyer.id } : {}),
          });
        } catch (cause) {
          // Logged in full for us, summarised for them: the message can name
          // a table or an environment variable, and neither belongs on a
          // customer's screen.
          console.error("Order creation failed", cause);
          // The stock was taken off the shelf a moment ago for an order that
          // does not exist. Without this the shop quietly loses inventory
          // every time the database hiccups.
          await releaseAll();
          return json(
            {
              ok: false,
              error:
                "We could not save your order just now. Nothing has been charged — " +
                "please try again in a moment.",
            },
            503,
          );
        }

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
