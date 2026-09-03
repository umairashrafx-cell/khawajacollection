/**
 * Legacy product URLs from the Lovable prototype.
 *
 * The prototype served PDPs at `/product/<slug>` (singular); the spec's route
 * is `/products/<slug>` (Section 7). Section 7 also requires old paths to 301
 * rather than break, so this forwards the slug through unchanged. A slug that
 * no longer exists in the catalogue then 404s on the real PDP, which is the
 * right answer for a product that is genuinely gone.
 *
 * Delete this once the old URLs stop appearing in Search Console.
 */

import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/product/$slug")({
  beforeLoad: ({ params }) => {
    throw redirect({ href: `/products/${params.slug}`, statusCode: 301 });
  },
});
