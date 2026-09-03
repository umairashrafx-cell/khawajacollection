/**
 * One descriptor per listing route. See docs/BUILD-SPEC.pdf Sections 7 and 11.2.
 *
 * Keeping these together means the nine listing pages differ only in data, and
 * every meta description stays unique and inside the 150–160 character window
 * Section 13 asks for.
 *
 * Copy is original to KC.
 */

import type { CatalogDescriptor } from "@/lib/catalog-page";

export const womenCatalog: CatalogDescriptor = {
  path: "/women",
  h1: "Women",
  metaTitle: "Women's Collection | Khawaja Collection",
  description:
    "Unstitched lawn, ready-to-wear kurtas, chiffon formals and made-to-order bridal, cut in limited runs in Lahore. Cash on delivery across Pakistan.",
  base: { category: "women" },
};

export const menCatalog: CatalogDescriptor = {
  path: "/men",
  h1: "Men",
  metaTitle: "Men's Collection | Khawaja Collection",
  description:
    "Cotton and linen kurtas, wash and wear shalwar suits, jacquard waistcoats and suiting by the metre. Cut clean, finished by hand, priced honestly.",
  base: { category: "men" },
};

export const accessoriesCatalog: CatalogDescriptor = {
  path: "/accessories",
  h1: "Accessories",
  metaTitle: "Accessories | Khawaja Collection",
  description:
    "Organza and chiffon dupattas, silk stoles and hand-stitched khussa. The small pieces that finish an outfit, in colours cut to match the collection.",
  base: { category: "accessories" },
};

export const unstitchedCatalog: CatalogDescriptor = {
  path: "/unstitched",
  h1: "Unstitched",
  metaTitle: "Unstitched Fabric | Khawaja Collection",
  description:
    "Lawn, khaddar and cotton yardage in one, two and three-piece sets for women and men. Cut generously so your own tailor has room to work.",
  base: { tags: ["unstitched"] },
};

export const readyToWearCatalog: CatalogDescriptor = {
  path: "/ready-to-wear",
  h1: "Ready to Wear",
  metaTitle: "Ready to Wear | Khawaja Collection",
  description:
    "Stitched kurtas, co-ords and formals in sizes XS to XXL, ready to wear as they arrive. No tailor, no waiting, no alterations needed.",
  base: { tags: ["ready-to-wear"] },
};

export const bridalCatalog: CatalogDescriptor = {
  path: "/bridal",
  h1: "Bridal",
  metaTitle: "Bridal & Walima | Khawaja Collection",
  description:
    "Made-to-order bridal lehengas, shararas and walima gowns, hand-embroidered in our Lahore studio and cut to your own measurements.",
  base: { tags: ["bridal"] },
};

export const newArrivalsCatalog: CatalogDescriptor = {
  path: "/new-arrivals",
  h1: "New In",
  metaTitle: "New Arrivals | Khawaja Collection",
  description:
    "The most recent pieces to reach the studio, newest first. Lawn, linen, silk and velvet for women and men, added in small runs through the season.",
  base: { isNewArrival: true, sort: "newest" },
};

export const saleCatalog: CatalogDescriptor = {
  path: "/sale",
  h1: "Sale",
  metaTitle: "Sale | Khawaja Collection",
  description:
    "Selected pieces from earlier editions, reduced while they last. Filter by discount to see what has come down the furthest.",
  base: { onSale: true },
  tone: "inverse",
};
