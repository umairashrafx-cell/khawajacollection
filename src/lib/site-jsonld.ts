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

export function organizationAndWebsiteJsonLd(): unknown {
  const profiles = realSocialProfiles();
  const email = contact.supportEmail === PLACEHOLDER ? null : contact.supportEmail;

  // Real as of 2026-09-04, so they belong in the markup. They were omitted
  // while they were placeholders — an invented address in structured data is
  // a claim made directly to a search engine, and for a single-location shop
  // it is the claim that decides whether Google can place you on a map.
  const postalAddress = {
    "@type": "PostalAddress",
    name: contact.address.name,
    streetAddress: contact.address.street,
    addressLocality: contact.address.city,
    addressRegion: contact.address.region,
    addressCountry: contact.address.country,
  };

  const organization: Record<string, unknown> = {
    "@type": "Organization",
    "@id": `${hasRealOrigin() ? absoluteUrl("") : ""}/#organization`,
    name: site.name,
    description: site.description,
    ...(hasRealOrigin() ? { url: absoluteUrl("/") } : {}),
    logo: absoluteUrl("/og/khawaja-collection.png"),
    ...(profiles.length > 0 ? { sameAs: profiles } : {}),
    address: postalAddress,
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
    "@id": `${hasRealOrigin() ? absoluteUrl("") : ""}/#website`,
    name: site.name,
    ...(hasRealOrigin() ? { url: absoluteUrl("/") } : {}),
    publisher: { "@id": `${hasRealOrigin() ? absoluteUrl("") : ""}/#organization` },
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
