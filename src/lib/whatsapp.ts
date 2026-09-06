/**
 * wa.me links.
 *
 * ONE BUILDER, because there are now two callers on the same screen — the
 * made-to-order CTA that replaces Add to bag, and the enquiry link under the
 * buy buttons on every product — and a link assembled twice is a link that
 * gets its prefilled message improved in one place only.
 *
 * NULL WHEN THE NUMBER IS NOT SET. `contact.whatsapp` is real today, but it
 * was a PLACEHOLDER for most of this project's life and a wa.me link built
 * from the literal string "PLACEHOLDER" is a link that opens WhatsApp on a
 * number that does not exist. Callers render nothing, or an explanation,
 * rather than a broken button.
 */

import { PLACEHOLDER, contact, site } from "@/config/site";
import { absoluteUrl, hasRealOrigin } from "./seo";

/** Digits only — wa.me rejects the stored `+92…` form. */
function dial(): string | null {
  // Widened before comparing: `contact` is `as const`, so with a real value
  // its literal type no longer overlaps "PLACEHOLDER" and TypeScript rejects
  // the check. The check still has to exist for the day it is cleared.
  const number: string = contact.whatsapp;
  if (!number || number === PLACEHOLDER) return null;

  const digits = number.replace(/[^0-9]/g, "");
  return digits.length > 0 ? digits : null;
}

/** Whether a WhatsApp link can be built at all. */
export function whatsappReady(): boolean {
  return dial() !== null;
}

/**
 * A prefilled enquiry about one product.
 *
 * THE LINK IS IN THE MESSAGE, and that is the point of prefilling it. A
 * customer's own words are usually "is this available?" with no indication of
 * which piece, on a phone, in a thread among many — so the shop has to ask
 * before it can answer. Name and URL make the first message answerable.
 *
 * The URL is included only when the origin is known: `absoluteUrl` falls back
 * to a root-relative path in development, and "/products/x" pasted into
 * WhatsApp is not a link at all.
 */
export function productEnquiryUrl(productName: string, productPath: string): string | null {
  const digits = dial();
  if (!digits) return null;

  const link = hasRealOrigin() ? `\n${absoluteUrl(productPath)}` : "";
  const message = `Hello ${site.name}, I would like to enquire about "${productName}".${link}`;

  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
