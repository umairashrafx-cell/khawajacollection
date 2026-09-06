/**
 * Site-wide structured data. docs/BUILD-SPEC.pdf Section 13:
 *
 *   "Organization + WebSite (with SearchAction) in the root layout"
 *
 * These two were missing entirely before Phase 9. They are what lets Google
 * associate the brand name with the site and, for WebSite, offer a search box
 * directly in the results page.
 *
 * EVERY FIELD HERE IS EITHER TRUE OR ABSENT. Hard Rule 9 forbids inventing a
 * phone number, an address or a social URL, and structured data is the worst
 * possible place to break that rule: it is a machine-readable claim made
 * directly to a search engine, and a wrong one is both a lie and a manual
 * action waiting to happen. So the address, the telephone and the unset social
 * profiles are omitted rather than filled with a placeholder string. An absent
 * property is honest; `"telephone": "PLACEHOLDER"` is not.
 */

import { PLACEHOLDER, contact, site, social } from "@/config/site";
import { absoluteUrl, hasRealOrigin } from "./seo";

/** The Open Graph card, re-exported so the root layout has one import. */
export { OG_IMAGE } from "./seo";

function realSocialProfiles(): string[] {
  // Widened to string[] before comparing. `social` is `as const`, so
  // Object.values gives a union of literal types and TypeScript rejects the
  // PLACEHOLDER comparison as having no overlap — correctly, for today's
  // values. The check still has to be here: the moment a profile is filled in
  // or emptied, the literal types change and the guard is what keeps a
  // placeholder out of the Organization markup.
  const urls: string[] = Object.values(social);

  // "#" is what src/config/site.ts uses for a profile Umair has not supplied.
  return urls.filter((url) => url !== "#" && url !== PLACEHOLDER && url.length > 0);
}

/**
 * The shop, as schema.org sees it.
 *
 * Real as of 2026-09-04, so it belongs in the markup. It was omitted while it
 * was a placeholder — an invented address in structured data is a claim made
 * directly to a search engine, and for a single-location shop it is the claim
 * that decides whether Google can place you on a map.
 *
 * ONE COPY, because two would be one too many. The homepage `Store` node and
 * the site-wide `Organization` describe the same physical shop, and an address
 * written out twice is an address that will eventually be corrected once.
 */
function postalAddress() {
  return {
    "@type": "PostalAddress",
    name: contact.address.name,
    streetAddress: contact.address.street,
    addressLocality: contact.address.city,
    addressRegion: contact.address.region,
    postalCode: contact.address.postalCode,
    addressCountry: contact.address.country,
  } as const;
}

/** `#organization`, absolute when the origin is known. */
function nodeId(fragment: string): string {
  return `${hasRealOrigin() ? absoluteUrl("") : ""}/#${fragment}`;
}

/**
 * The homepage's `Store` node.
 *
 * WHY IT IS NOT JUST THE ORGANIZATION. `Store` is a `LocalBusiness`, and
 * LocalBusiness is the type Google reads for the map pack, the knowledge panel
 * and "near me" results — the searches a shop on Katchery Road actually wants.
 * `Organization` is the brand behind the website. They are two true statements
 * about one business, so the Store carries `parentOrganization` pointing at
 * the Organization's `@id`: without that link they read as two unrelated
 * businesses with the same address, which is the shape of a spam signal
 * rather than a shop.
 *
 * IT CARRIED NO ADDRESS OR TELEPHONE UNTIL 2026-09-07, and the comment saying
 * why cited a PLACEHOLDER that had been filled in three days earlier. The
 * Organization markup was updated at the time and this was missed, which is
 * exactly the drift that `postalAddress()` now exists to prevent.
 *
 * OPENING HOURS ARE HERE AS OF 2026-09-07, when the days arrived. They were
 * withheld for three days with the window already known, because schema.org
 * requires a dayOfWeek and guessing "every day" would have told Google the
 * shop is open on a day it is shut. Friday carries no specification and that
 * is the point: Google reads an absent day as Closed.
 */
export function storeJsonLd(description: string): unknown {
  return {
    "@context": "https://schema.org",
    "@type": "Store",
    "@id": nodeId("store"),
    name: site.name,
    description,
    address: postalAddress(),
    telephone: contact.phone,
    ...(hasRealOrigin() ? { url: absoluteUrl("/") } : {}),
    image: absoluteUrl("/og/khawaja-collection.png"),
    // One specification covering six identical days rather than six of them:
    // `dayOfWeek` takes an array precisely so a uniform week states its hours
    // once, and six copies is six chances to change five of them.
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [...contact.hours.days],
        opens: contact.hours.opens,
        closes: contact.hours.closes,
      },
    ],
    parentOrganization: { "@id": nodeId("organization") },
    currenciesAccepted: "PKR",
    paymentAccepted: "Cash on Delivery",
    areaServed: "PK",
  };
}

export function organizationAndWebsiteJsonLd(): unknown {
  const profiles = realSocialProfiles();
  // Widened before comparing, for the same reason as realSocialProfiles():
  // `contact` is `as const`, so once a value is filled in its literal type no
  // longer overlaps "PLACEHOLDER" and TypeScript rejects the check. The check
  // still has to be here — it is what keeps a placeholder out of the markup if
  // the value is ever cleared.
  const supportEmail: string = contact.supportEmail;
  const email = supportEmail === PLACEHOLDER || !supportEmail ? null : supportEmail;

  const organization: Record<string, unknown> = {
    "@type": "Organization",
    "@id": nodeId("organization"),
    name: site.name,
    description: site.description,
    ...(hasRealOrigin() ? { url: absoluteUrl("/") } : {}),
    logo: absoluteUrl("/og/khawaja-collection.png"),
    ...(profiles.length > 0 ? { sameAs: profiles } : {}),
    address: postalAddress(),
    telephone: contact.phone,
    ...(email
      ? {
          contactPoint: {
            "@type": "ContactPoint",
            contactType: "customer support",
            email,
            telephone: contact.phone,
            areaServed: "PK",
            availableLanguage: ["en", "ur"],
          },
        }
      : {}),
  };

  const website: Record<string, unknown> = {
    "@type": "WebSite",
    "@id": nodeId("website"),
    name: site.name,
    ...(hasRealOrigin() ? { url: absoluteUrl("/") } : {}),
    publisher: { "@id": nodeId("organization") },
    inLanguage: site.locale,
    potentialAction: {
      "@type": "SearchAction",
      // The escaped brace is not a typo — schema.org's SearchAction template
      // syntax requires `{search_term_string}` to be marked this way, and
      // Google ignores the action without it.
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${absoluteUrl("/search")}?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  // One @graph rather than two separate script tags: it lets WebSite reference
  // Organization by @id instead of repeating it.
  return { "@context": "https://schema.org", "@graph": [organization, website] };
}
