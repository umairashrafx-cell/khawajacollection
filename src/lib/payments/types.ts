/**
 * The payment seam. See docs/BUILD-SPEC.pdf Section 11.5, reproduced verbatim.
 *
 * Real providers — JazzCash, Easypaisa, PayFast, Safepay — plug in behind this
 * interface later without touching the UI.
 *
 * GUARDRAIL 4, restated because this is the file where it matters most:
 * no payment credentials, keys, tokens or provider SDKs belong in this repo,
 * at any point, in any phase. A provider that needs a secret reads it from the
 * server environment at call time and never from source.
 */

import type { Order, PaymentMethodId } from "@/types";

export interface PaymentInitResult {
  /** True when the order may proceed without any further customer action. */
  ok: boolean;
  /** Where to send the customer next, for providers that redirect. */
  redirectUrl?: string;
  /** The provider's own reference, stored against the order. */
  reference?: string;
  message?: string;
}

export type PaymentStatus = "pending" | "paid" | "failed";

export interface PaymentProvider {
  id: PaymentMethodId;
  label: string;
  isEnabled: boolean;

  /**
   * Called AFTER the order row exists, and that changed with the gateways.
   *
   * The spec has this taking an `OrderDraft`, which was enough while Cash on
   * Delivery was the only method: nothing needed a name for the transaction.
   * A hosted gateway does. It has to be handed a reference that is unique,
   * that survives the round trip, and that we can match a callback against
   * twenty minutes later — and the only thing satisfying all three is the
   * order number, which does not exist until the order is written.
   *
   * So the order is created `pending` first and initiate is told about it. An
   * order that is never paid is a row we can see and clean up; a payment we
   * cannot tie to an order is money in limbo.
   */
  initiate(order: Order): Promise<PaymentInitResult>;
  verify(reference: string): Promise<PaymentStatus>;
}

/** What a provider needs from a created order to describe itself to the customer. */
export type PaymentSummary = Pick<Order, "orderNumber" | "paymentMethod" | "paymentStatus">;
