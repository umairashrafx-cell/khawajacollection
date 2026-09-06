/**
 * Google Maps URLs for the shop.
 *
 * BUILT FROM THE ADDRESS, NOT FROM COORDINATES. `contact.address` in
 * src/config/site.ts is the one place the shop's location is written down, and
 * a latitude/longitude pair stored beside it would be a second copy able to
 * disagree with the first — the exact failure the `Store` and `Organization`
 * markup already had. Google resolves this address to the right pin (verified
 * against the live Business Profile listing, which shows the shop at Katchery
 * Road with postcode 50400), so there is nothing a coordinate pair would buy.
 *
 * NO API KEY, DELIBERATELY. Google's documented Maps Embed API needs a billing
 * -enabled key, which is a credential to provision, store, restrict by referrer
 * and rotate — for a single static map of one shop that never changes. The
 * `output=embed` form needs none of that.
 *
 * The trade is that `output=embed` is not in Google's published documentation,
 * so it carries no compatibility promise the way the keyed API does. If it ever
 * stops working the map goes blank while the rest of the page is unaffected,
 * and the fix is to swap `mapEmbedSrc` for the keyed endpoint. The two
 * "open in Maps" links below are different: `?api=1` IS Google's documented,
 * supported URL scheme and is not going anywhere.
 */

import { contact, site } from "@/config/site";

/**
 * The shop as a single search string.
 *
 * BOTH NAMES, in the order Google itself holds them. The Business Profile is
 * registered as "Khawaja Collection" and its address line begins "Ameen Cloth
 * House" — the signage carries both — so a query with both is the one most
 * likely to resolve to that listing rather than to the street. An address
 * alone, in a bazaar, lands on the road.
 */
export function mapQuery(): string {
  return [
    site.name,
    contact.address.name,
    contact.address.street,
    contact.address.city,
    contact.address.postalCode,
    "Pakistan",
  ]
    .filter(Boolean)
    .join(", ");
}

/** `src` for the embedded map iframe. */
export function mapEmbedSrc(): string {
  return `https://www.google.com/maps?q=${encodeURIComponent(mapQuery())}&output=embed`;
}

/** Opens the shop's listing in Google Maps. Documented `?api=1` scheme. */
export function mapListingUrl(): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery())}`;
}

/**
 * Opens Google Maps with directions to the shop, leaving the starting point to
 * the visitor's own device — which is both the useful default and the one that
 * does not require knowing where they are.
 */
export function mapDirectionsUrl(): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(mapQuery())}`;
}
