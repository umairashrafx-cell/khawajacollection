/**
 * Legacy category URLs from the Lovable prototype.
 *
 * Section 7: "Slugs are immutable once published — if a product is renamed,
 * keep the old slug and add a 301." The prototype shipped one `/category/$slug`
 * route with its own slug vocabulary; Phase 4 replaced it with the spec's
 * routes, so every old path 301s to its new home rather than dying.
 *
 * This file exists only to redirect. Delete it once the old URLs stop
 * appearing in Search Console.
 */

import { createFileRoute, notFound, redirect } from "@tanstack/react-router";

const MOVED: Record<string, string> = {
  women: "/women",
  "women-unstitched": "/women/unstitched",
  "women-pret": "/women/ready-to-wear",
  "women-formals": "/women/formals",
  "women-shawls": "/women/shawls",
  men: "/men",
  "men-kurta": "/men/kurtas",
  "men-suits": "/men/shalwar-suits",
  "men-waistcoats": "/men/waistcoats",
  "men-fabric": "/men/unstitched",
  accessories: "/accessories",
  "accessories-dupatta": "/accessories/dupattas",
  "accessories-footwear": "/accessories/footwear",
  sale: "/sale",
  all: "/new-arrivals",
};

export const Route = createFileRoute("/category/$slug")({
  beforeLoad: ({ params }) => {
    const destination = MOVED[params.slug];
    // An unrecognised legacy slug is a 404, not a guess — redirecting it to
    // some default would tell Google these are the same page.
    if (!destination) throw notFound();
    throw redirect({ href: destination, statusCode: 301 });
  },
});
