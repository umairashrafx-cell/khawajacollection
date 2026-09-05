/**
 * POST /api/payments/jazzcash/callback
 *
 * THIS IS THE ONLY PLACE AN ORDER BECOMES PAID. Not the confirmation page, not
 * the redirect, not anything the browser says. A customer can navigate to a
 * "thank you" URL by typing it; only a message JazzCash signed with our
 * integrity salt can move money in this system.
 *
 * The route therefore does exactly three things, in this order:
 *   1. verify the signature, and refuse everything that fails it
 *   2. record the outcome against the order
 *   3. send the customer somewhere sensible
 *
 * A FAILED PAYMENT RELEASES THE STOCK, because the reservation was taken when
 * the order was written. Without that, every abandoned checkout would quietly
 * hold a piece off the shelf until someone noticed.
 *
 * IT IS SAFE TO CALL TWICE. Gateways retry. The order is only moved when it is
 * still `pending`, so a duplicate callback changes nothing and cannot restock
 * an order twice.
 */

import { createFileRoute } from "@tanstack/react-router";

import { jazzcashReadCallback } from "@/lib/payments/jazzcash";
import { orderRepository, productRepository } from "@/lib/repositories";

/**
 * Both a form post and a query string are possible depending on how the
 * gateway is configured, so both are read into one bag.
 */
async function readBody(request: Request): Promise<Record<string, string>> {
  const fields: Record<string, string> = {};
  for (const [key, value] of new URL(request.url).searchParams) fields[key] = value;
  try {
    const form = await request.formData();
    for (const [key, value] of form) fields[key] = String(value);
  } catch {
    // No form body. The query string may still carry everything.
  }
  return fields;
}

/** The customer's browser is following this, so it must end somewhere human. */
function seeOther(path: string) {
  return new Response(null, {
    status: 303,
    headers: { Location: path, "Cache-Control": "no-store, private" },
  });
}

/**
 * One implementation, two verbs.
 *
 * Which verb JazzCash uses depends on how the merchant account is configured,
 * and it is not a security property: the signature is what decides, not the
 * method. So both entry points run this.
 */
async function handle(request: Request): Promise<Response> {
  const body = await readBody(request);
  const result = await jazzcashReadCallback(body);

  /*
   * An unverified callback is not a failed payment — it is not a
   * payment at all. It is logged and refused, and no order is touched,
   * because acting on it is exactly how a forged "paid" gets in.
   */
  if (!result) {
    console.error("JazzCash callback failed signature verification", {
      ref: body["pp_TxnRefNo"],
      code: body["pp_ResponseCode"],
    });
    return new Response("Invalid signature", { status: 400 });
  }

  const page = await orderRepository.listAll({ q: result.orderNumber, perPage: 5 });
  const order = page.items.find(
    (candidate) => candidate.orderNumber.toLowerCase() === result.orderNumber.toLowerCase(),
  );
  if (!order) {
    console.error("JazzCash callback for an unknown order", result.orderNumber);
    return new Response("Unknown order", { status: 404 });
  }

  // Already settled: a retry, or the customer refreshing. Nothing to do.
  if (order.paymentStatus !== "pending") {
    return seeOther(`/orders/${order.orderNumber}`);
  }

  if (result.status === "paid") {
    await orderRepository.markPayment(order.orderNumber, "paid", result.reference);
    return seeOther(`/orders/${order.orderNumber}`);
  }

  await orderRepository.markPayment(order.orderNumber, "failed", result.reference);
  await orderRepository.updateStatus(order.orderNumber, "cancelled");
  // The stock was reserved when the order was written and nobody bought
  // it, so it goes back on the shelf.
  for (const item of order.items) {
    await productRepository.releaseStock(item.variantId, item.quantity);
  }

  return seeOther(`/checkout?payment=failed&order=${encodeURIComponent(order.orderNumber)}`);
}

export const Route = createFileRoute("/api/payments/jazzcash/callback")({
  server: {
    handlers: {
      POST: ({ request }) => handle(request),
      GET: ({ request }) => handle(request),
    },
  },
});
