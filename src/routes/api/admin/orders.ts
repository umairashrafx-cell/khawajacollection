/**
 * The admin order endpoint. Read the list, read one, change a status.
 *
 * EVERY PATH THROUGH THIS FILE BEGINS WITH `adminFromRequest`. These handlers
 * read every customer's name, phone and delivery address, and can change any
 * order's state — there is nothing here that fails safe on its own, so the
 * check is the first statement in each handler rather than a wrapper someone
 * could forget to apply.
 *
 * A non-admin gets 403, not 404. That is a deliberate departure from how
 * /api/account/orders answers: there, hiding whether an order exists matters
 * because order numbers are guessable. Here the caller is already
 * authenticated and the only question is whether they are staff — telling them
 * plainly beats a confusing "not found" for someone who genuinely should have
 * access and has been given the wrong role.
 */

import { createFileRoute } from "@tanstack/react-router";

import { adminFromRequest } from "@/lib/auth/verify";
import { orderRepository } from "@/lib/repositories";
import { ORDER_STEPS } from "@/lib/order-steps";
import type { Order, OrderStatus } from "@/types";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store, private" },
  });
}

/** Every state an order may be moved to. `cancelled` is not one of the six steps. */
const VALID_STATUSES: OrderStatus[] = [...ORDER_STEPS.map((s) => s.status), "cancelled"];

function isStatus(value: unknown): value is OrderStatus {
  return typeof value === "string" && VALID_STATUSES.includes(value as OrderStatus);
}

/** The admin view of an order — everything, because packing a parcel needs it. */
function toAdminOrder(order: Order) {
  return {
    orderNumber: order.orderNumber,
    status: order.status,
    createdAt: order.createdAt,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    email: order.email ?? null,
    phone: order.phone,
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

export const Route = createFileRoute("/api/admin/orders")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const admin = await adminFromRequest(request);
        if (!admin) return json({ ok: false, error: "Admin access required." }, 403);

        const url = new URL(request.url);
        const number = url.searchParams.get("number");

        if (number) {
          // Not findForTracking: that deliberately demands a matching contact
          // number, which is the right rule for a guest and the wrong one for
          // staff looking at their own order book. The unscoped list, filtered
          // to this number, is the honest way to ask.
          const page = await orderRepository.listAll({ q: number, perPage: 5 });
          const found = page.items.find(
            (o) => o.orderNumber.toLowerCase() === number.trim().toLowerCase(),
          );
          if (!found) return json({ ok: false, error: "Order not found." }, 404);
          return json({ ok: true, order: toAdminOrder(found) });
        }

        const statusParam = url.searchParams.get("status");
        const page = await orderRepository.listAll({
          ...(isStatus(statusParam) ? { status: statusParam } : {}),
          ...(url.searchParams.get("q") ? { q: url.searchParams.get("q") as string } : {}),
          page: Number(url.searchParams.get("page") ?? 1) || 1,
        });

        return json({
          ok: true,
          orders: page.items.map(toAdminOrder),
          total: page.total,
          page: page.page,
          perPage: page.perPage,
          counts: page.counts,
          revenue: page.revenue,
        });
      },

      POST: async ({ request }) => {
        const admin = await adminFromRequest(request);
        if (!admin) return json({ ok: false, error: "Admin access required." }, 403);

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return json({ ok: false, error: "Send a JSON body." }, 400);
        }

        const { orderNumber, status } = (body ?? {}) as Record<string, unknown>;

        if (typeof orderNumber !== "string" || !orderNumber.trim()) {
          return json({ ok: false, error: "orderNumber is required." }, 400);
        }
        // Validated against the list rather than trusted: `status` has a CHECK
        // constraint in Postgres, so an unknown value would fail at the
        // database with a message no shopkeeper could act on.
        if (!isStatus(status)) {
          return json(
            { ok: false, error: `status must be one of: ${VALID_STATUSES.join(", ")}` },
            400,
          );
        }

        const updated = await orderRepository.updateStatus(orderNumber, status);
        if (!updated) return json({ ok: false, error: "Order not found." }, 404);

        return json({ ok: true, order: toAdminOrder(updated) });
      },
    },
  },
});
