/**
 * Order history for a signed-in customer. docs/BUILD-SPEC.pdf Section 11.6
 * ("Pages: profile, orders, order detail") and Section 8.3.
 *
 * GET /api/account/orders            — every order belonging to the caller
 * GET /api/account/orders?number=KC-… — one of them, in full
 *
 * The caller is identified by an `Authorization: Bearer` token that is
 * verified against Supabase before anything is read (src/lib/auth/verify.ts).
 * The browser cannot query `orders` itself: 0002_rls.sql gives `anon` no
 * select policy at all, and while an authenticated session does have one, the
 * detail this returns is assembled with the service role after the identity
 * has been established here. So this route is the only door, and it is locked.
 *
 * The list is deliberately thinner than the detail. A history page needs a
 * date, a status and a total; it does not need every delivery address the
 * customer has ever used, so the shipping address is only sent for the single
 * order actually being viewed.
 */

import { createFileRoute } from "@tanstack/react-router";

import { userFromRequest } from "@/lib/auth/verify";
import { orderRepository } from "@/lib/repositories";
import type { Order } from "@/types";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    // Someone else's session must never be served from a shared cache.
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store, private" },
  });
}

function summary(order: Order) {
  return {
    orderNumber: order.orderNumber,
    status: order.status,
    createdAt: order.createdAt,
    total: order.totals.total,
    itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
    /** Enough for a thumbnail row, not the whole order. */
    firstItemName: order.items[0]?.nameSnapshot ?? "",
  };
}

function detail(order: Order) {
  return {
    orderNumber: order.orderNumber,
    status: order.status,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    createdAt: order.createdAt,
    shipping: order.shipping,
    totals: order.totals,
    items: order.items.map((item) => ({
      name: item.nameSnapshot,
      slug: item.slug,
      size: item.size,
      colorName: item.colorName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    })),
  };
}

export const Route = createFileRoute("/api/account/orders")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const user = await userFromRequest(request);
        if (!user) return json({ ok: false, error: "Sign in to see your orders." }, 401);

        const number = new URL(request.url).searchParams.get("number");

        if (number) {
          const order = await orderRepository.findForUser(user.id, number);
          // Same answer for "not yours" and "does not exist", so the endpoint
          // cannot be used to discover which order numbers are real.
          if (!order) return json({ ok: false, error: "Order not found." }, 404);
          return json({ ok: true, order: detail(order) });
        }

        const orders = await orderRepository.listForUser(user.id);
        return json({ ok: true, orders: orders.map(summary) });
      },
    },
  },
});
