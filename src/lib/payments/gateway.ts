/**
 * Shared machinery for the two hosted-redirect gateways.
 *
 * WHY HOSTED REDIRECT AND NOT A DIRECT API. Both JazzCash and Easypaisa offer
 * a mode where the customer types their wallet number and MPIN on OUR page and
 * we relay it. That mode puts this shop in the business of handling other
 * people's PINs, which raises the compliance burden enormously and gives the
 * customer no way to tell a real form from a copied one. The hosted flow sends
 * them to the gateway's own domain, where the padlock and the URL are the
 * bank's. We never see a PIN, and there is nothing here worth stealing.
 *
 * TWO LOCKS, IN DIFFERENT PLACES.
 *
 *   1. A PUBLIC flag (`VITE_PAYMENTS_JAZZCASH`) decides whether the option is
 *      rendered at checkout. It is a switch, not a secret, and it is allowed
 *      into the browser bundle.
 *   2. The SECRETS live in the server environment and are read at call time.
 *      A provider whose secrets are missing refuses, loudly, no matter what
 *      the public flag says.
 *
 * They are separate on purpose. Turning the option on in the UI cannot, by
 * itself, cause the shop to accept money it has no way to collect — and
 * Guardrail 4 keeps every credential on the far side of the `VITE_` boundary.
 *
 * MONEY IS IN PAISA HERE. Both gateways want the smallest unit as an integer.
 * The rest of this codebase keeps PKR as whole rupees (Hard Rule 4), so the
 * conversion happens once, in `toPaisa`, rather than at each call site where
 * one of them would eventually be forgotten.
 */

/** Server-only. Returns "" when unset, so callers decide what missing means. */
export function secret(name: string): string {
  if (typeof process === "undefined") return "";
  return process.env[name] ?? "";
}

/**
 * Whether the option should be offered at checkout. Public by design: it says
 * "this shop accepts JazzCash", which is on the footer of every Pakistani
 * storefront anyway.
 */
export function publicFlag(value: string | undefined): boolean {
  return value === "on" || value === "true" || value === "1";
}

/** Whole rupees to paisa. Both gateways reject decimals. */
export function toPaisa(rupees: number): string {
  return String(Math.round(rupees * 100));
}

/**
 * Pakistan Standard Time, as `yyyyMMddHHmmss`.
 *
 * BOTH GATEWAYS TIMESTAMP IN PKT, NOT UTC, and both reject a transaction whose
 * time is outside a window around their own clock. A server in Washington or
 * Frankfurt — which is where Vercel actually runs this — would otherwise send
 * a timestamp five to ten hours out and every payment would fail with an error
 * that says nothing about time zones. UTC+5 has no daylight saving, so a fixed
 * offset is correct all year rather than merely usually correct.
 */
const PKT_OFFSET_MS = 5 * 60 * 60 * 1000;

export function pktStamp(date: Date = new Date(), plusMinutes = 0): string {
  const t = new Date(date.getTime() + PKT_OFFSET_MS + plusMinutes * 60_000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    String(t.getUTCFullYear()) +
    pad(t.getUTCMonth() + 1) +
    pad(t.getUTCDate()) +
    pad(t.getUTCHours()) +
    pad(t.getUTCMinutes()) +
    pad(t.getUTCSeconds())
  );
}

/** Node's crypto, imported lazily so it never lands in a browser bundle. */
export async function nodeCrypto(): Promise<typeof import("node:crypto")> {
  return import("node:crypto");
}

/**
 * Constant-time string compare for signatures.
 *
 * `a === b` on a signature leaks, through how long it takes to fail, roughly
 * how many leading characters were right. That is a real attack on a callback
 * endpoint an attacker can call as often as they like. Length is compared
 * first and separately because timingSafeEqual throws on a length mismatch,
 * and a length mismatch is not secret.
 */
export async function signatureMatches(a: string, b: string): Promise<boolean> {
  if (a.length !== b.length) return false;
  const { timingSafeEqual } = await nodeCrypto();
  return timingSafeEqual(Buffer.from(a, "utf8"), Buffer.from(b, "utf8"));
}

/**
 * The absolute URL a gateway should send the customer back to.
 *
 * Derived from VITE_SITE_URL rather than the incoming request, because the
 * return URL is part of the signed payload: taking it from a header would let
 * a caller redirect our own signed transaction to a host they control.
 */
export function callbackUrl(siteUrl: string, provider: string): string {
  return `${siteUrl.replace(/\/+$/, "")}/api/payments/${provider}/callback`;
}

/** Minimal HTML escaping for values that go into a form field. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * A page whose only job is to POST a signed form to a gateway and get out of
 * the way.
 *
 * WHY A PAGE AT ALL. Both gateways take a POST with a dozen signed fields.
 * A browser cannot be sent to a POST by a redirect — Location produces a GET —
 * so something has to submit a form. Doing it from the checkout page would put
 * the merchant password and the hash in the client bundle, which is the one
 * thing that must never happen. Rendering it here keeps every credential on
 * the server: the browser receives a form that is already signed and can no
 * longer be altered without invalidating it.
 *
 * The submit button is real and the form works without JavaScript. The script
 * only saves a tap. A payment step that breaks when a script fails to load is
 * a payment step that loses orders on exactly the connections this shop sells
 * to.
 *
 * `noindex` because this URL carries an order number, and `no-store` because
 * a signed, expiring payload has no business in any cache.
 */
export function autoSubmitForm(action: string, fields: Record<string, string>, label: string) {
  const inputs = Object.entries(fields)
    .map(([k, v]) => `<input type="hidden" name="${escapeHtml(k)}" value="${escapeHtml(v)}">`)
    .join("");

  const html = `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Redirecting to ${escapeHtml(label)}…</title>
<style>
  body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;
       background:#faf8f5;color:#14110f;
       font:16px/1.5 Inter,system-ui,-apple-system,Segoe UI,Helvetica,Arial,sans-serif}
  .box{text-align:center;padding:2rem;max-width:22rem}
  button{margin-top:1.25rem;min-height:44px;padding:0 1.5rem;border:0;cursor:pointer;
         background:#14110f;color:#faf8f5;font:inherit;font-size:.875rem;letter-spacing:.02em}
  p{color:#3a3633;font-size:.875rem}
</style>
</head><body>
<div class="box">
  <p>Taking you to ${escapeHtml(label)} to complete your payment.</p>
  <form id="kc-pay" method="POST" action="${escapeHtml(action)}">
    ${inputs}
    <button type="submit">Continue to ${escapeHtml(label)}</button>
  </form>
</div>
<script>document.getElementById('kc-pay').submit();</script>
</body></html>`;

  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store, private",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}

/**
 * The order a payment page or callback is about.
 *
 * GUARDED, because the order number is in a URL a stranger could guess. Only a
 * recently created order that is still awaiting payment can have a payment
 * form generated for it — otherwise this endpoint would confirm which order
 * numbers exist and what they cost, and would let someone re-open a payment
 * for an order that is already settled.
 */
export const PAYMENT_WINDOW_MS = 30 * 60 * 1000;

export function payable(order: { paymentStatus: string; createdAt: string }): boolean {
  if (order.paymentStatus !== "pending") return false;
  return Date.now() - new Date(order.createdAt).getTime() < PAYMENT_WINDOW_MS;
}
