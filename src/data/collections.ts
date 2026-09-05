/**
 * Editorial collections — the `/collections/$slug` routes and the homepage
 * featured banner. See docs/BUILD-SPEC.pdf Sections 7, 8.1 and 11.1.
 *
 * Mock data for Phases 1–7. Phase 8 replaces this file with the `collections`
 * table. Copy here is original to KC.
 */

import type { Collection } from "@/types";

function hero(slug: string, alt: string) {
  return {
    url: `/placeholders/collection-${slug}-16x9.svg`,
    alt,
    width: 1920,
    height: 1080,
  };
}

export const collections: Collection[] = [
  {
    slug: "the-new-season",
    name: "The New Season",
    tagline: "Softly structured pieces for the turn of the year.",
    metaDescription:
      "Softly structured lawn, khaddar and silk for the turn of the year, cut in limited runs in Lahore. Cash on delivery across Pakistan, easy exchange within 7 days.",
    heroImage: hero("the-new-season", "The New Season collection"),
    isActive: true,
  },
  {
    slug: "wedding-season",
    name: "Wedding Season",
    tagline: "Chiffon, organza and raw silk for the months of celebration.",
    metaDescription:
      "Chiffon, organza and raw silk for mehndi, nikkah and walima, with hand-embroidered bridal made to order. Cash on delivery across Pakistan from Khawaja Collection.",
    heroImage: hero("wedding-season", "Wedding Season collection"),
    isActive: true,
  },
  {
    slug: "everyday-essentials",
    name: "Everyday Essentials",
    tagline: "Quiet cloth, cut clean. Made to be worn often.",
    metaDescription:
      "Cotton, linen and khaddar cut clean and finished by hand — the pieces you reach for on an ordinary Tuesday. Cash on delivery across Pakistan, delivered in 3 to 5 days.",
    heroImage: hero("everyday-essentials", "Everyday Essentials collection"),
    isActive: true,
  },
  {
    slug: "summer-lawn",
    name: "Summer Lawn",
    tagline: "Printed and embroidered lawn for the long hot months.",
    metaDescription:
      "Printed and embroidered lawn in one, two and three-piece sets, cut generously for a Pakistani summer. Cash on delivery nationwide, easy exchange within 7 days.",
    heroImage: hero("summer-lawn", "Summer Lawn collection"),
    isActive: true,
  },
];
