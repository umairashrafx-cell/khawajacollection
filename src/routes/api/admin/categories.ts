/**
 * Creating and renaming categories.
 *
 *   GET  /api/admin/categories    the tree, with a product count per category
 *   POST /api/admin/categories    create or rename one
 *
 * THE SLUG IS THE THING TO BE CAREFUL WITH. It is the primary key, it is the
 * URL of the listing page, and every product carries it in `category_slug`.
 * So this endpoint will create a slug and will never move one: a POST whose
 * slug already exists updates the name, description, image and order of that
 * row and nothing else. Renaming "Bedsheets" to "Bedding" changes the heading
 * and the nav label; it leaves /bedsheets working and every product on it
 * where it was. That is almost always what is meant, and the alternative —
 * 404ing a live page and orphaning its products in one statement — is never
 * what is meant.
 *
 * A SUBCATEGORY'S SLUG IS DERIVED, NOT TYPED. Section 8.3 makes slugs globally
 * unique, so `/women/unstitched` is the category `women-unstitched`, and the
 * URL only carries the segment. The form sends a parent and a segment; this
 * joins them. Letting someone type the full slug would let them type
 * `men-kurtas` under Women, and the page would then be unreachable from both.
 */

import { createFileRoute } from "@tanstack/react-router";

import { adminFromRequest } from "@/lib/auth/verify";
import { categoryRepository, productRepository } from "@/lib/repositories";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store, private" },
  });
}

function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/** Lowercase, hyphenated. Matches the product route's rule exactly. */
function normaliseSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const Route = createFileRoute("/api/admin/categories")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const admin = await adminFromRequest(request);
        if (!admin) return json({ ok: false, error: "Admin access required." }, 403);

        const tree = await categoryRepository.tree();

        /*
         * A count per category, because the single most useful thing to know
         * about a category you are about to rename is whether anything is in
         * it. One read of the catalogue at sixty-odd products; past a few
         * thousand this is a Postgres `group by` and a change to this file.
         */
        const everything = await productRepository.list({ perPage: 2000, sort: "featured" });
        const counts = new Map<string, number>();
        for (const product of everything.items) {
          counts.set(product.categorySlug, (counts.get(product.categorySlug) ?? 0) + 1);
          if (product.subcategorySlug) {
            counts.set(product.subcategorySlug, (counts.get(product.subcategorySlug) ?? 0) + 1);
          }
        }

        return json({
          ok: true,
          categories: tree.map((parent) => ({
            slug: parent.slug,
            name: parent.name,
            description: parent.description ?? null,
            imageUrl: parent.image?.url ?? null,
            sortOrder: parent.sortOrder,
            productCount: counts.get(parent.slug) ?? 0,
            children: parent.children.map((child) => ({
              slug: child.slug,
              name: child.name,
              description: child.description ?? null,
              imageUrl: child.image?.url ?? null,
              sortOrder: child.sortOrder,
              productCount: counts.get(child.slug) ?? 0,
              /** The bit that appears in the URL: `women-unstitched` → `unstitched`. */
              segment: child.slug.startsWith(`${parent.slug}-`)
                ? child.slug.slice(parent.slug.length + 1)
                : child.slug,
            })),
          })),
        });
      },

      POST: async ({ request }) => {
        const admin = await adminFromRequest(request);
        if (!admin) return json({ ok: false, error: "Admin access required." }, 403);

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return json({ ok: false, error: "Send a JSON body." }, 400);
        }

        const raw = (body ?? {}) as Record<string, unknown>;

        const name = str(raw["name"]);
        if (!name) return json({ ok: false, error: "Give the category a name." }, 400);
        if (name.length > 60) {
          return json(
            { ok: false, error: "Keep the name under 60 characters — it goes in the nav." },
            400,
          );
        }

        const parentSlug = str(raw["parentSlug"]) || null;
        const existing = await categoryRepository.list();

        if (parentSlug) {
          const parent = existing.find((category) => category.slug === parentSlug);
          if (!parent)
            return json({ ok: false, error: "That parent category does not exist." }, 400);
          // One level. The URL scheme is /parent/segment and there is no
          // /parent/segment/segment route, so a grandchild would be a row
          // nothing could ever link to.
          if (parent.parentSlug) {
            return json({ ok: false, error: "Categories only go two levels deep." }, 400);
          }
        }

        const segment = normaliseSlug(str(raw["segment"]) || name);
        if (!segment) {
          return json(
            {
              ok: false,
              error: "That name has no letters or numbers in it to build a web address from.",
            },
            400,
          );
        }

        const slug = parentSlug ? `${parentSlug}-${segment}` : segment;

        const clash = existing.find((category) => category.slug === slug);
        // Creating over an existing slug is a rename, and the caller has to say
        // so. Silently editing a category someone else made is how a shop ends
        // up with "Bedsheets" pointing at the men's kurtas.
        if (clash && raw["allowRename"] !== true) {
          return json(
            {
              ok: false,
              error: `"${clash.name}" already uses the address ${slug}. Edit it instead, or choose another name.`,
            },
            409,
          );
        }
        if (clash && (clash.parentSlug ?? null) !== parentSlug) {
          return json(
            { ok: false, error: "A category cannot be moved to a different parent." },
            400,
          );
        }

        const sortOrderRaw = raw["sortOrder"];
        const sortOrder = Number(
          sortOrderRaw === undefined || sortOrderRaw === null || str(sortOrderRaw) === ""
            ? // Default to the end of its own level, so a new category never
              // silently jumps ahead of the ones already there.
              existing.filter((c) => (c.parentSlug ?? null) === parentSlug).length + 1
            : sortOrderRaw,
        );
        if (!Number.isFinite(sortOrder) || !Number.isInteger(sortOrder) || sortOrder < 0) {
          return json({ ok: false, error: "Order must be a whole number." }, 400);
        }

        try {
          const category = await categoryRepository.saveCategory({
            slug,
            name,
            parentSlug,
            description: str(raw["description"]) || null,
            imageUrl: str(raw["imageUrl"]) || clash?.image?.url || null,
            sortOrder,
          });
          return json({ ok: true, category, created: !clash });
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "The category could not be saved.";

          if (message.includes("SUPABASE_SERVICE_ROLE_KEY")) {
            return json(
              {
                ok: false,
                error:
                  "The shop cannot write to its own taxonomy: the server is missing its database key. " +
                  "Nothing was saved. Set SUPABASE_SERVICE_ROLE_KEY in the hosting environment and try again.",
              },
              503,
            );
          }

          return json({ ok: false, error: message }, 500);
        }
      },
    },
  },
});
