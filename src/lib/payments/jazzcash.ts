/**
 * JazzCash — Page Redirection (HTTP POST), API v2.0.
 *
 * ⚠ WRITTEN TO THE PUBLISHED SPEC AND NEVER RUN AGAINST A SANDBOX. No
 * merchant credentials existed when this was built, so nothing here has been
 * exercised end to end. Treat it as a first draft that compiles, not as
 * working payment code: run the sandbox flow, compare every field against the
 * Integration Guide in your merchant pack, and only then set
 * VITE_PAYMENTS_JAZZCASH=on.
 *
 * THE FLOW
 *   1. We create the order first, `pending`, so it has a number.
 *   2. /api/payments/jazzcash/start renders a self-submitting form of the
 *      fields below and posts the customer to JazzCash.
 *   3. They pay on JazzCash's own domain.
 *   4. JazzCash POSTs the result back to /api/payments/jazzcash/callback.
 *   5. We verify the hash, then mark the order paid or failed.
 *
 * THE ONLY THING THAT DECIDES WHETHER AN ORDER IS PAID IS STEP 5. The customer
 * being redirected to a "thank you" page proves nothing — they can navigate
 * there by typing it. Everything about this file is arranged so that the
 * money decision is made from a signed message and nowhere else.
 *
 * pp_TxnRefNo IS THE ORDER NUMBER, minus its hyphens. JazzCash requires the
 * reference to be unique per attempt, so a retry appends a counter. Keeping
 * the order number recognisable inside it is what makes their portal usable
 * when a customer rings up about a payment.
 */

import { callbackUrl, pktStamp, publicFlag, secret, signatureMatches, toPaisa } from "./gateway";
import type { PaymentInitResult, PaymentProvider, PaymentStatus } from "./types";
import type { Order } from "@/types";

const SANDBOX =
  "https://sandbox.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform/";
const LIVE = "https://payments.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform/";

/** "000" is the only code that means the money moved. */
const SUCCESS_CODE = "000";

/** Their window is 30 minutes; ours is shorter so a stale tab cannot pay. */
const EXPIRY_MINUTES = 25;

export function jazzcashEndpoint(): string {
  return secret("JAZZCASH_ENV") === "live" ? LIVE : SANDBOX;
}

export function jazzcashConfigured(): boolean {
  return Boolean(
    secret("JAZZCASH_MERCHANT_ID") &&
    secret("JAZZCASH_PASSWORD") &&
    secret("JAZZCASH_INTEGRITY_SALT"),
  );
}

/**
 * The v2.0 secure hash.
 *
 * HMAC-SHA256, keyed with the Integrity Salt, over: the salt, then every
 * non-empty field's VALUE, sorted by FIELD NAME, joined with "&".
 *
 * Three details that are easy to get wrong and produce an error message that
 * names none of them:
 *   - sort by key, but hash the values, not "key=value"
 *   - drop empty fields entirely rather than hashing an empty segment
 *   - the salt appears twice: once as the HMAC key and once as the first
 *     segment of the message
 */
export async function jazzcashHash(fields: Record<string, string>): Promise<string> {
  const salt = secret("JAZZCASH_INTEGRITY_SALT");
  const ordered = Object.keys(fields)
    .sort()
    .map((key) => fields[key] ?? "")
    .filter((value) => value !== "");

  const message = [salt, ...ordered].join("&");
  const { createHmac } = await import("node:crypto");
  return createHmac("sha256", salt).update(message, "utf8").digest("hex").toUpperCase();
}

/** Every field JazzCash posts to its own form, hash included. */
export async function jazzcashFields(
  order: Order,
  siteUrl: string,
  attempt = 1,
): Promise<Record<string, string>> {
  const reference = `${order.orderNumber.replace(/-/g, "")}${attempt > 1 ? `R${attempt}` : ""}`;

  const fields: Record<string, string> = {
    pp_Version: "2.0",
    pp_TxnType: "",
    pp_Language: "EN",
    pp_MerchantID: secret("JAZZCASH_MERCHANT_ID"),
    pp_SubMerchantID: "",
    pp_Password: secret("JAZZCASH_PASSWORD"),
    pp_BankID: "",
    pp_ProductID: "",
    pp_TxnRefNo: reference,
    pp_Amount: toPaisa(order.totals.total),
    pp_TxnCurrency: "PKR",
    pp_TxnDateTime: pktStamp(),
    pp_BillReference: order.orderNumber,
    pp_Description: `Khawaja Collection ${order.orderNumber}`,
    pp_TxnExpiryDateTime: pktStamp(new Date(), EXPIRY_MINUTES),
    pp_ReturnURL: callbackUrl(siteUrl, "jazzcash"),
    // Carried through untouched and echoed back, which is how the callback
    // knows which order it is about without trusting anything the browser says.
    ppmpf_1: order.orderNumber,
    ppmpf_2: "",
    ppmpf_3: "",
    ppmpf_4: "",
    ppmpf_5: "",
  };

  fields["pp_SecureHash"] = await jazzcashHash(fields);
  return fields;
}

/**
 * Reads a callback. Returns null when the signature does not verify, and null
 * must be treated as "this did not happen" — never as a failed payment, and
 * certainly never as a successful one.
 */
export async function jazzcashReadCallback(body: Record<string, string>): Promise<{
  orderNumber: string;
  reference: string;
  status: PaymentStatus;
  message: string;
} | null> {
  const received = body["pp_SecureHash"] ?? "";
  if (!received) return null;

  // The hash is computed over everything EXCEPT itself.
  const rest: Record<string, string> = {};
  for (const [key, value] of Object.entries(body)) {
    if (key !== "pp_SecureHash") rest[key] = value;
  }

  const expected = await jazzcashHash(rest);
  if (!(await signatureMatches(received.toUpperCase(), expected))) return null;

  const code = body["pp_ResponseCode"] ?? "";
  return {
    // ppmpf_1 is ours and is inside the signed payload, so it is trustworthy
    // here in a way that a query parameter would not be.
    orderNumber: body["ppmpf_1"] ?? body["pp_BillReference"] ?? "",
    reference: body["pp_TxnRefNo"] ?? "",
    status: code === SUCCESS_CODE ? "paid" : "failed",
    message: body["pp_ResponseMessage"] ?? "",
  };
}

export const jazzcashProvider: PaymentProvider = {
  id: "jazzcash",
  label: "JazzCash",
  // The public switch. The secrets are checked again in `initiate`, because a
  // flag in a bundle is a preference and not an authorisation.
  isEnabled: publicFlag(import.meta.env.VITE_PAYMENTS_JAZZCASH),

  async initiate(order: Order): Promise<PaymentInitResult> {
    if (!jazzcashConfigured()) {
      throw new Error(
        "JazzCash is switched on but its credentials are not set on the server. " +
          "Set JAZZCASH_MERCHANT_ID, JAZZCASH_PASSWORD and JAZZCASH_INTEGRITY_SALT.",
      );
    }
    return {
      ok: true,
      // A GET cannot carry a signed form, so the browser goes to a route of
      // ours that posts one. See src/routes/api/payments/jazzcash.start.ts.
      redirectUrl: `/api/payments/jazzcash/start?order=${encodeURIComponent(order.orderNumber)}`,
      reference: order.orderNumber,
      message: "Continue to JazzCash to pay.",
    };
  },

  async verify(): Promise<PaymentStatus> {
    // There is a Status Inquiry API for reconciling a callback that never
    // arrived. Until this has been through a sandbox, claiming to implement it
    // would be worse than saying it is not here.
    return "pending";
  },
};
