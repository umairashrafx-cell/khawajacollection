/**
 * Formatting helpers. See docs/BUILD-SPEC.pdf Sections 8.1 and 16.
 *
 * Prices are integers in PKR everywhere in this codebase. No floats, no paisa.
 */

const pkr = new Intl.NumberFormat("en-PK", {
  maximumFractionDigits: 0,
  useGrouping: true,
});

/**
 * Section 16 — renders as `PKR 4,990`. Takes an integer number of rupees.
 * Non-finite input formats as `PKR 0` rather than throwing in a render path.
 */
export function formatPKR(value: number): string {
  const amount = Number.isFinite(value) ? Math.round(value) : 0;
  return `PKR ${pkr.format(amount)}`;
}

/**
 * Whole-number discount off the original price, or `null` when there is no
 * genuine saving. Used for the `-30%` badge and the PDP price block.
 */
export function discountPercent(
  price: number,
  compareAt: number | null | undefined,
): number | null {
  if (!compareAt || !Number.isFinite(price) || compareAt <= price) return null;
  return Math.round(((compareAt - price) / compareAt) * 100);
}

/**
 * Legacy alias kept so the Lovable-era JSX keeps compiling while Phases 2–6
 * migrate it. New code calls formatPKR().
 *
 * @deprecated Use formatPKR().
 */
export function formatPrice(value: number, currency = "PKR"): string {
  if (currency === "PKR") return formatPKR(value);
  return `${currency} ${pkr.format(Number.isFinite(value) ? Math.round(value) : 0)}`;
}

/** Short date for order history and tracking, e.g. `3 Sep 2026`. */
export function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-PK", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

/**
 * Section 16 — accepts `03XXXXXXXXX` and `+923XXXXXXXXX`, normalises to `+92`.
 * Returns `null` when the input is not a valid Pakistani mobile number, so
 * callers decide how to surface the error.
 */
export function normalizePakistaniPhone(input: string): string | null {
  const digits = input.replace(/[\s()-]/g, "");
  if (/^03\d{9}$/.test(digits)) return `+92${digits.slice(1)}`;
  if (/^\+923\d{9}$/.test(digits)) return digits;
  if (/^00923\d{9}$/.test(digits)) return `+${digits.slice(2)}`;
  if (/^923\d{9}$/.test(digits)) return `+${digits}`;
  return null;
}

/** Section 16 — human-readable, phone-friendly: `KC-2026-00042`. */
export function formatOrderNumber(sequence: number, year = new Date().getFullYear()): string {
  return `KC-${year}-${String(sequence).padStart(5, "0")}`;
}

/** The price a customer actually pays for a product (Section 8.1, CartLine). */
export function resolvePrice(product: { price: number; salePrice?: number }): number {
  return product.salePrice ?? product.price;
}
