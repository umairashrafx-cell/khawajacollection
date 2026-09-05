/**
 * Shared SEO primitives. docs/BUILD-SPEC.pdf Section 13.
 *
 * Section 13 asks for the same four things on every route — title, description,
 * canonical, Open Graph with a 1200x630 image — and the reliable way to get
 * that is one helper every route calls, not thirty routes each remembering.
 * Before this existed, Open Graph images were missing from all of them.
 *
 * ON `site.url` BEING A PLACEHOLDER. Canonicals and OG URLs have to be
 * absolute to be worth anything, and the real origin is an environment
 * variable that is not set in development. Rather than invent a domain
 * (Hard Rule 9), `absoluteUrl` returns a root-relative path when the origin is
 * unknown. A relative canonical is legal and resolves correctly; a canonical
 * pointing at a domain we guessed would be actively wrong. `VITE_SITE_URL` is
 * on the launch checklist for exactly this reason.
 */

import { PLACEHOLDER, site } from "@/config/site";

/** The Open Graph card. 1200x630 per Section 13. */
export const OG_IMAGE = {
  path: "/og/khawaja-collection.png",
  width: 1200,
  height: 630,
  alt: `${site.name} — ${site.tagline}`,
} as const;

export function hasRealOrigin(): boolean {
  return site.url !== PLACEHOLDER && typeof site.url === "string" && site.url.length > 0;
}

/** Absolute when the origin is known, root-relative when it is not. See the note above. */
export function absoluteUrl(path: string): string {
  /*
   * ALREADY ABSOLUTE MEANS LEAVE IT ALONE.
   *
   * This took a root-relative path for its whole life, because every image on
   * the site was a file in /public. Product photographs uploaded through the
   * admin are Supabase Storage URLs with their own origin, and prefixing one
   * produced this, live, on a real product page:
   *
   *   https://www.khawajacollection.comhttps://vaiiwafricvgovxopjbs.supabase.co/...
   *
   * A broken og:image is invisible on the site itself and shows up only as a
   * blank card when someone shares the product on WhatsApp, which is where
   * this shop's traffic comes from.
   */
  if (/^https?:\/\//i.test(path)) return path;

  if (!hasRealOrigin()) return path;
  return `${String(site.url).replace(/\/$/, "")}${path}`;
}

export interface MetaInput {
  title: string;
  description: string;
  /** Root-relative, e.g. "/women/formals". */
  path: string;
  /** Overrides the default card, e.g. a product's own photograph. */
  image?: { url: string; width?: number; height?: number; alt?: string } | undefined;
  /** Section 7 — cart, checkout, account and the auth pages. */
  noindex?: boolean | undefined;
  /** "website" for pages, "product" for a PDP, "article" for content. */
  ogType?: string | undefined;
}

/**
 * Section 13's title pattern is `{thing} | Khawaja Collection`, under 60
 * characters. The suffix is 22 of those, so a long product name would push the
 * whole thing past the point where Google truncates it. Rather than ship a
 * title with an ellipsis in the middle of a name, the name is trimmed at a word
 * boundary and the suffix always survives — the brand is the part a searcher
 * scanning a results page uses to recognise us.
 */
export function pageTitle(subject: string): string {
  const suffix = ` | ${site.name}`;
  const room = 60 - suffix.length;
  if (subject.length <= room) return `${subject}${suffix}`;

  const cut = subject.slice(0, room);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > room * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}${suffix}`;
}

/**
 * Section 13 wants descriptions of 150-160 characters and never duplicated.
 * Short source copy is padded with the brand line rather than left at 40
 * characters, which Google tends to replace with scraped page text.
 */
export function pageDescription(source: string, fallbackSuffix = ""): string {
  const text = source.replace(/\s+/g, " ").trim();
  const padded = text.length >= 120 || !fallbackSuffix ? text : `${text} ${fallbackSuffix}`.trim();
  if (padded.length <= 160) return padded;

  const cut = padded.slice(0, 157);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 120 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

/**
 * Every `head()` in the app builds its meta and links from this, so a route
 * cannot forget Open Graph or a canonical.
 */
export function seoHead(input: MetaInput): {
  meta: { title?: string; name?: string; property?: string; content?: string }[];
  links: { rel: string; href: string }[];
} {
  const canonical = absoluteUrl(input.path);
  const image = input.image ?? {
    url: OG_IMAGE.path,
    width: OG_IMAGE.width,
    height: OG_IMAGE.height,
    alt: OG_IMAGE.alt,
  };

  const meta: { title?: string; name?: string; property?: string; content?: string }[] = [
    { title: input.title },
    { name: "description", content: input.description },

    /*
     * en_PK, because WhatsApp and Facebook pick a locale for the card and
     * default to en_US without this. It costs one tag and stops a Pakistani
     * shop's previews being rendered as an American one's.
     */
    { property: "og:locale", content: "en_PK" },

    { property: "og:title", content: input.title },
    { property: "og:description", content: input.description },
    { property: "og:type", content: input.ogType ?? "website" },
    { property: "og:url", content: canonical },
    { property: "og:image", content: absoluteUrl(image.url) },
    ...(image.width ? [{ property: "og:image:width", content: String(image.width) }] : []),
    ...(image.height ? [{ property: "og:image:height", content: String(image.height) }] : []),
    { property: "og:image:alt", content: image.alt ?? input.title },

    // Twitter reads most og:* tags, but not the card type, and without it a
    // link renders as a small thumbnail rather than the 1200x630 card.
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: input.title },
    { name: "twitter:description", content: input.description },
    { name: "twitter:image", content: absoluteUrl(image.url) },
  ];

  if (input.noindex) {
    meta.push({ name: "robots", content: "noindex, nofollow" });
  }

  return { meta, links: [{ rel: "canonical", href: canonical }] };
}
