/**
 * Catalogue taxonomy. See docs/BUILD-SPEC.pdf Sections 7 and 8.1.
 *
 * Mock data for Phases 1–7. Phase 8 replaces this file with the `categories`
 * table; the shape it produces must not change.
 *
 * Slugs are globally unique because Section 8.3 makes `slug` the primary key,
 * so a subcategory is named `${parentSlug}-${urlSegment}` and the URL carries
 * only the segment: `women-unstitched` is reached at `/women/unstitched`.
 */

import type { Category } from "@/types";

function card(slug: string, alt: string) {
  return {
    url: `/placeholders/category-${slug}-4x5.svg`,
    alt,
    width: 960,
    height: 1200,
  };
}

export const categories: Category[] = [
  {
    slug: "women",
    name: "Women",
    description: "Unstitched lawn, ready-to-wear and hand-finished formals, cut in limited runs.",
    image: card("women", "Khawaja Collection womenswear"),
    sortOrder: 1,
  },
  {
    slug: "women-unstitched",
    name: "Unstitched",
    description: "Lawn, khaddar and cotton yardage in one, two and three-piece sets.",
    parentSlug: "women",
    sortOrder: 1,
  },
  {
    slug: "women-ready-to-wear",
    name: "Ready to Wear",
    description: "Stitched kurtas and co-ords in sizes XS to XXL, ready to wear today.",
    parentSlug: "women",
    sortOrder: 2,
  },
  {
    slug: "women-formals",
    name: "Formals",
    description: "Chiffon, organza and raw silk for wedding season and beyond.",
    parentSlug: "women",
    sortOrder: 3,
  },
  {
    slug: "women-bridal",
    name: "Bridal",
    description: "Made-to-order bridal and walima pieces, hand-embroidered in Lahore.",
    parentSlug: "women",
    sortOrder: 4,
  },
  {
    slug: "women-shawls",
    name: "Shawls & Wraps",
    description: "Pashmina, wool and velvet shawls for the cold months.",
    parentSlug: "women",
    sortOrder: 5,
  },
  {
    slug: "men",
    name: "Men",
    description: "Kurtas, shalwar suits and waistcoats in considered, quiet cloth.",
    image: card("men", "Khawaja Collection menswear"),
    sortOrder: 2,
  },
  {
    slug: "men-kurtas",
    name: "Kurtas",
    description: "Cotton, linen and khaddar kurtas cut clean and finished by hand.",
    parentSlug: "men",
    sortOrder: 1,
  },
  {
    slug: "men-shalwar-suits",
    name: "Shalwar Suits",
    description: "Complete two-piece suits in wash and wear, cotton and blended cloth.",
    parentSlug: "men",
    sortOrder: 2,
  },
  {
    slug: "men-waistcoats",
    name: "Waistcoats",
    description: "Jacquard and velvet waistcoats to layer over a plain kurta.",
    parentSlug: "men",
    sortOrder: 3,
  },
  {
    slug: "men-unstitched",
    name: "Unstitched Fabric",
    description: "Suiting yardage by the metre, for your own tailor.",
    parentSlug: "men",
    sortOrder: 4,
  },
  {
    slug: "accessories",
    name: "Accessories",
    description: "Dupattas, stoles and hand-made khussa to finish the look.",
    image: card("accessories", "Khawaja Collection accessories"),
    sortOrder: 3,
  },
  {
    slug: "accessories-dupattas",
    name: "Dupattas & Stoles",
    parentSlug: "accessories",
    sortOrder: 1,
  },
  {
    slug: "accessories-footwear",
    name: "Khussa & Footwear",
    parentSlug: "accessories",
    sortOrder: 2,
  },
];
