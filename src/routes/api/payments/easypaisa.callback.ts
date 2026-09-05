/**
 * /api/payments/easypaisa/callback — hit TWICE per payment, for different
 * reasons, and telling them apart is the whole job of this file.
 *
 *   First hit  — carries `auth_token` and no status. This is NOT a result. It
 *                is a ticket meaning "post this back to Confirm.jsf and I will
 *                tell you what happened". Treating it as success marks every
 *                abandoned payment as paid, which is the single worst bug
 *                available in this file.
 *   Second hit — carries a status code. This is the answer, and the only thing
 *                that moves an order to `paid`.
 *
 * ⚠ UNVERIFIED. Easypaisa has shipped more than one version of this handshake
 * and the field names differ between them. Everything below follows the
 * published Easypay flow, but it has never been run against a sandbox. Check
 * it against your merchant pack before switching Easypaisa on.
 *
 * NOTE THE ASYMMETRY WITH JAZZCASH. JazzCash signs its callback, so we can
 * verify it cryptographically. The Easypay result post is not signed the same
 * way, so the protection here is different: the order must still be `pending`,
 * and the amount is not taken from the callback at all — it is whatever we
 * already wrote. A forged callback can therefore claim an order is paid, but
 * cannot change what it costs. That is a real gap, and it is the main reason
 * to reconcile against the merchant portal before dispatching a prepaid order.
 */

import { createFileRoute } from "@tanstack/react-router";

import { autoSubmitForm } from "@/lib/payments/gateway";
import { easypaisaCallbackKind, easypaisaConfirmEndpoint } from "@/lib/payments/easypaisa";
import { orderRepository, productRepository } from "@/lib/repositories";
import { site } from "@/config/site";

async function readBody(request: Request): Promise<Record<string, string>> {
  const fields: Record<string, string> = {};
  for (const [key, value] of new URL(request.url).searchParams) fields[key] = value;
  try {
    const form = await request.formData();
    for (const [key, value] of form) fields[key] = String(value);
  } catch {
    // Query string only.
  }
  return fields;
}

function seeOther(path: string) {
  return new Response(null, {
    status: 303,
    headers: { Location: path, "Cache-Control": "no-store, private" },
  });
}

async function handle(request: Request): Promise<Response> {
  const body = await readBody(request);
  const kind = easypaisaCallbackKind(body);

  if (!kind) {
    console.error("Easypaisa callback with neither a token nor a status", Object.keys(body));
    return new Response("Unrecognised callback", { status: 400 });
  }

  /*
   * Step one of two. Bounce the ticket straight back to Confirm.jsf using the
   * same self-submitting form the outbound leg uses, and touch nothing: no
   * order has been paid yet and pretending otherwise here is the failure mode
   * this whole file is arranged to avoid.
   */
  if (kind.kind === "confirm") {
    return autoSubmitForm(
      easypaisaConfirmEndpoint(),
      {
        auth_token: kind.authToken,
        postBackURL: `${site.url.replace(/\/+$/, "")}/api/payments/easypaisa/callback`,
      },
      "Easypaisa",
    );
  }

  const orderNumber = body["orderRefNumber"] ?? body["orderRefNum"] ?? "";
  if (!orderNumber) {
    console.error("Easypaisa result carried no order reference", Object.keys(body));
    return new Response("Unknown order", { status: 400 });
  }

  const page = await orderRepository.listAll({ q: orderNumber, perPage: 5 });
  const order = page.items.find(
    (candidate) => candidate.orderNumber.toLowerCase() === orderNumber.toLowerCase(),
  );
  if (!order) {
    console.error("Easypaisa callback for an unknown order", orderNumber);
    return new Response("Unknown order", { status: 404 });
  }

  // A retry, or a refresh. The first answer stands.
  if (order.paymentStatus !== "pending") {
    return seeOther(`/orders/${order.orderNumber}`);
  }

  if (kind.status === "paid") {
    await orderRepository.markPayment(order.orderNumber, "paid", orderNumber);
    return seeOther(`/orders/${order.orderNumber}`);
  }

  await orderRepository.markPayment(order.orderNumber, "failed", orderNumber);
  await orderRepository.updateStatus(order.orderNumber, "cancelled");
  for (const item of order.items) {
    await productRepository.releaseStock(item.variantId, item.quantity);
  }

  return seeOther(`/checkout?payment=failed&order=${encodeURIComponent(order.orderNumber)}`);
}

export const Route = createFileRoute("/api/payments/easypaisa/callback")({
  server: {
    handlers: {
      POST: ({ request }) => handle(request),
      GET: ({ request }) => handle(request),
    },
  },
});
