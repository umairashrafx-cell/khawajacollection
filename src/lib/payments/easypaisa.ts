/**
 * Easypaisa — Easypay hosted checkout.
 *
 * ⚠ WRITTEN TO THE PUBLISHED SPEC AND NEVER RUN AGAINST A SANDBOX, and this
 * one needs checking harder than JazzCash does. Easypaisa has shipped several
 * versions of Easypay with different field names and two different hashing
 * schemes, and which one you get depends on what your merchant pack says.
 * Verify every field below against yours before setting
 * VITE_PAYMENTS_EASYPAISA=on.
 *
 * THE TWO-STEP FLOW, which is the part that surprises people. JazzCash posts
 * once and tells you the answer. Easypay does not:
 *
 *   1. We post the order to /easypay/Index.jsf.
 *   2. The customer pays on Easypaisa's domain.
 *   3. Easypaisa redirects to our postBackURL with an `auth_token` — and this
 *      is NOT the result. It is a ticket saying "ask me again".
 *   4. We post that token to /easypay/Confirm.jsf.
 *   5. Easypaisa posts the real result to our postBackURL.
 *
 * So the callback route has to distinguish a step-3 hit from a step-5 hit, and
 * the presence of `auth_token` without a status is what tells them apart. An
 * implementation that treats step 3 as success marks every abandoned payment
 * as paid.
 *
 * THE HASH IS AES, NOT HMAC. Easypay encrypts the parameter string with
 * AES-128-ECB under the merchant hash key and base64s the result. That is
 * unusual enough that it looks like a mistake when you read it next to
 * JazzCash's HMAC, so: it is not a mistake, it is what the spec says. An
 * account issued without a hash key omits the field entirely.
 */

import { publicFlag, secret, toPaisa } from "./gateway";
import type { PaymentInitResult, PaymentProvider, PaymentStatus } from "./types";
import type { Order } from "@/types";

const SANDBOX = "https://easypaystg.easypaisa.com.pk/easypay/Index.jsf";
const LIVE = "https://easypay.easypaisa.com.pk/easypay/Index.jsf";

const SANDBOX_CONFIRM = "https://easypaystg.easypaisa.com.pk/easypay/Confirm.jsf";
const LIVE_CONFIRM = "https://easypay.easypaisa.com.pk/easypay/Confirm.jsf";

/** "0000" is their success code. Everything else is a failure or a decline. */
const SUCCESS_CODE = "0000";

const live = () => secret("EASYPAISA_ENV") === "live";

export const easypaisaEndpoint = () => (live() ? LIVE : SANDBOX);
export const easypaisaConfirmEndpoint = () => (live() ? LIVE_CONFIRM : SANDBOX_CONFIRM);

export function easypaisaConfigured(): boolean {
  return Boolean(secret("EASYPAISA_STORE_ID"));
}

/** `yyyyMMdd HHmmss`, which is Easypay's format and not JazzCash's. */
export function easypaisaExpiry(minutes = 25): string {
  const t = new Date(Date.now() + 5 * 60 * 60 * 1000 + minutes * 60_000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${t.getUTCFullYear()}${pad(t.getUTCMonth() + 1)}${pad(t.getUTCDate())} ` +
    `${pad(t.getUTCHours())}${pad(t.getUTCMinutes())}${pad(t.getUTCSeconds())}`
  );
}

/**
 * AES-128-ECB over "key1=value1&key2=value2" with the fields sorted by name,
 * base64 encoded. Returns "" when no hash key is configured, which is a valid
 * Easypay setup rather than an error.
 */
export async function easypaisaHash(fields: Record<string, string>): Promise<string> {
  const key = secret("EASYPAISA_HASH_KEY");
  if (!key) return "";

  const message = Object.keys(fields)
    .sort()
    .filter((k) => (fields[k] ?? "") !== "")
    .map((k) => `${k}=${fields[k]}`)
    .join("&");

  const { createCipheriv } = await import("node:crypto");
  // Their key is a 16-character ASCII string used directly as the AES-128 key.
  const cipher = createCipheriv("aes-128-ecb", Buffer.from(key, "utf8"), null);
  return Buffer.concat([cipher.update(message, "utf8"), cipher.final()]).toString("base64");
}

export async function easypaisaFields(
  order: Order,
  siteUrl: string,
): Promise<Record<string, string>> {
  const fields: Record<string, string> = {
    storeId: secret("EASYPAISA_STORE_ID"),
    // Rupees with two decimals here, unlike JazzCash's integer paisa. Same
    // money, two formats, one of the reasons toPaisa lives in gateway.ts.
    amount: (Number(toPaisa(order.totals.total)) / 100).toFixed(2),
    postBackURL: `${siteUrl.replace(/\/+$/, "")}/api/payments/easypaisa/callback`,
    orderRefNum: order.orderNumber,
    expiryDate: easypaisaExpiry(),
    // 1 means their page bounces the customer straight back rather than
    // waiting for a click, which is what a phone user expects.
    autoRedirect: "1",
    // Blank offers the customer both the wallet and a card on Easypaisa's own
    // page. Naming one here would take that choice away for no gain.
    paymentMethod: "",
    ...(order.email ? { emailAddr: order.email } : {}),
    mobileNum: order.phone,
  };

  const hash = await easypaisaHash(fields);
  if (hash) fields["merchantHashedReq"] = hash;
  return fields;
}

/**
 * Which step of the dance a callback is.
 *
 * `auth_token` with no status is step 3 — a ticket, not an answer. A status
 * code is step 5, the real result. Getting this wrong in the permissive
 * direction marks abandoned payments as paid, so the default is "not paid".
 */
export function easypaisaCallbackKind(
  body: Record<string, string>,
): { kind: "confirm"; authToken: string } | { kind: "result"; status: PaymentStatus } | null {
  const status = body["status"] ?? body["responseCode"] ?? "";
  if (status) {
    return { kind: "result", status: status === SUCCESS_CODE ? "paid" : "failed" };
  }
  const authToken = body["auth_token"] ?? "";
  if (authToken) return { kind: "confirm", authToken };
  return null;
}

export const easypaisaProvider: PaymentProvider = {
  id: "easypaisa",
  label: "Easypaisa",
  isEnabled: publicFlag(import.meta.env.VITE_PAYMENTS_EASYPAISA),

  async initiate(order: Order): Promise<PaymentInitResult> {
    if (!easypaisaConfigured()) {
      throw new Error(
        "Easypaisa is switched on but its credentials are not set on the server. " +
          "Set EASYPAISA_STORE_ID (and EASYPAISA_HASH_KEY if your account uses one).",
      );
    }
    return {
      ok: true,
      redirectUrl: `/api/payments/easypaisa/start?order=${encodeURIComponent(order.orderNumber)}`,
      reference: order.orderNumber,
      message: "Continue to Easypaisa to pay.",
    };
  },

  async verify(): Promise<PaymentStatus> {
    // Easypaisa has an inquiry API. Same reasoning as JazzCash: not until a
    // sandbox has proved the happy path.
    return "pending";
  },
};
