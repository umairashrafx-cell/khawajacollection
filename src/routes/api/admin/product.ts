/**
 * Creating and editing a product.
 *
 *   GET  /api/admin/product           the category tree, to populate the form
 *   GET  /api/admin/product?id=…      one product, in the shape the form edits
 *   POST /api/admin/product           create (no id) or replace (with id)
 *
 * SEPARATE FROM /api/admin/products (plural) ON PURPOSE. That route is the
 * stock screen: it returns a trimmed row per product and writes exactly one
 * number. This one returns and accepts the whole product. Keeping them apart
 * means the stock screen cannot accidentally grow the power to rewrite a price,
 * and the payload the stock screen downloads stays small.
 *
 * WHY THE VALIDATION BELOW IS LONG. Everything here is typed by the browser as
 * a string and arrives over the network, so none of it can be trusted — but the
 * more useful point is that this is the only place a wrong value gets caught
 * before it reaches a customer. A price of NaN, a sale price above the real
 * price, a slug that collides with an existing product: each is invisible in
 * the database and obvious on the shop. So every field is checked, and every
 * failure returns a sentence a shopkeeper can act on rather than a field name.
 */

import { createFileRoute } from "@tanstack/react-router";

import { adminFromRequest } from "@/lib/auth/verify";
import { categoryRepository, productRepository } from "@/lib/repositories";
import type { ProductInput } from "@/lib/repositories";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store, private" },
  });
}

function fail(message: string) {
  return json({ ok: false, error: message }, 400);
}

/** Trimmed string, or "" — never undefined, so the checks below stay simple. */
function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/** A trimmed string or null, for the columns that are genuinely optional. */
function nullableStr(value: unknown): string | null {
  const text = str(value);
  return text === "" ? null : text;
}

/**
 * Whole rupees. Section 4 forbids floats, and a price arriving as 2499.99 is
 * far more likely to be a typo than an intention, so it is rejected rather
 * than rounded — rounding would silently change the number on the shelf.
 */
function money(value: unknown): number | null {
  const amount = typeof value === "number" ? value : Number(str(value));
  if (!Number.isFinite(amount) || !Number.isInteger(amount) || amount < 0) return null;
  return amount;
}

/** Lowercase, hyphenated, URL-safe. This becomes /products/<slug> forever. */
function normaliseSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const HEX = /^#[0-9a-fA-F]{6}$/;

/**
 * Images are stored as URLs, and a URL in this payload becomes an `src` on the
 * storefront. Restricting them to the Supabase Storage origin the upload helper
 * writes to (or to our own /placeholders) stops an admin session from being
 * talked into embedding a third-party tracking pixel on every product page.
 */
function isAllowedImageUrl(url: string): boolean {
  if (url.startsWith("/")) return true;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && parsed.pathname.includes("/storage/v1/object/public/");
  } catch {
    return false;
  }
}

interface Parsed {
  input: ProductInput;
  id: string | undefined;
}

function parse(body: unknown): Parsed | string {
  const raw = (body ?? {}) as Record<string, unknown>;

  const name = str(raw["name"]);
  if (!name) return "Give the product a name.";
  if (name.length > 120) return "The name is too long — keep it under 120 characters.";

  const slug = normaliseSlug(str(raw["slug"]) || name);
  if (!slug) return "The web address could not be worked out from that name. Type one yourself.";

  const shortDescription = str(raw["shortDescription"]);
  if (!shortDescription) return "Write a short description — it is what Google shows.";
  if (shortDescription.length > 160) {
    return `The short description is ${shortDescription.length} characters. Google cuts it at 160.`;
  }

  const price = money(raw["price"]);
  if (price === null || price === 0) return "Enter a price in whole rupees.";

  const salePriceRaw = raw["salePrice"];
  const hasSalePrice =
    salePriceRaw !== null && salePriceRaw !== undefined && str(salePriceRaw) !== "";
  const salePrice = hasSalePrice ? money(salePriceRaw) : null;
  if (hasSalePrice && salePrice === null) return "The sale price must be whole rupees, or empty.";
  // A sale price at or above the real price shows a struck-out number that is
  // smaller than the one beside it. Customers notice.
  if (salePrice !== null && salePrice >= price) {
    return "The sale price has to be lower than the price.";
  }

  const categorySlug = str(raw["categorySlug"]);
  if (!categorySlug) return "Choose a category.";

  const piecesRaw = raw["pieces"];
  const hasPieces = piecesRaw !== null && piecesRaw !== undefined && str(piecesRaw) !== "";
  const pieces = hasPieces ? money(piecesRaw) : null;
  if (hasPieces && (pieces === null || pieces < 1 || pieces > 5)) {
    return "Pieces must be a number from 1 to 5, or empty.";
  }

  const tags = Array.isArray(raw["tags"])
    ? raw["tags"].map((tag) => normaliseSlug(str(tag))).filter(Boolean)
    : [];

  const imagesRaw = Array.isArray(raw["images"]) ? raw["images"] : [];
  const images: ProductInput["images"] = [];
  for (const entry of imagesRaw) {
    const image = (entry ?? {}) as Record<string, unknown>;
    const url = str(image["url"]);
    if (!url) continue;
    if (!isAllowedImageUrl(url)) return "One of the images is not from this shop's own storage.";
    // Falling back to the product name keeps every image described. An empty
    // alt on a product photo is an accessibility failure Section 15 forbids.
    images.push({ url, alt: str(image["alt"]) || name });
  }
  if (images.length === 0) return "Add at least one photograph.";
  if (images.length > 8) return "Eight photographs is the most a product page shows.";

  const variantsRaw = Array.isArray(raw["variants"]) ? raw["variants"] : [];
  const variants: ProductInput["variants"] = [];
  const seenSkus = new Set<string>();
  for (const entry of variantsRaw) {
    const variant = (entry ?? {}) as Record<string, unknown>;
    const size = str(variant["size"]);
    if (!size) return "Every size row needs a size.";

    const sku = str(variant["sku"]).toUpperCase();
    if (!sku) return `The ${size} row needs a SKU.`;
    // SKU is the key `saveProduct` upserts on, so a duplicate would make two
    // rows collapse into one and silently lose a size.
    if (seenSkus.has(sku)) return `Two size rows share the SKU ${sku}.`;
    seenSkus.add(sku);

    const stock = money(variant["stock"]);
    if (stock === null) return `Stock for ${size} must be a whole number of 0 or more.`;

    const colorHex = str(variant["colorHex"]) || "#000000";
    if (!HEX.test(colorHex)) return `The colour for ${size} must be a hex code like #F3EFE7.`;

    const id = str(variant["id"]);
    variants.push({
      ...(id ? { id } : {}),
      sku,
      size,
      colorName: str(variant["colorName"]) || "Default",
      colorHex,
      stock,
    });
  }
  if (variants.length === 0) return "Add at least one size.";

  const id = str(raw["id"]);

  return {
    id: id || undefined,
    input: {
      slug,
      name,
      description: str(raw["description"]) || shortDescription,
      shortDescription,
      price,
      salePrice,
      categorySlug,
      subcategorySlug: nullableStr(raw["subcategorySlug"]),
      fabric: nullableStr(raw["fabric"]),
      pieces,
      care: nullableStr(raw["care"]),
      tags,
      isFeatured: raw["isFeatured"] === true,
      isNewArrival: raw["isNewArrival"] === true,
      isMadeToOrder: raw["isMadeToOrder"] === true,
      // Defaults to published. A shopkeeper who filled in this form meant to
      // sell the thing; the checkbox is there to take it down later.
      isActive: raw["isActive"] !== false,
      images,
      variants,
    },
  };
}

export const Route = createFileRoute("/api/admin/product")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const admin = await adminFromRequest(request);
        if (!admin) return json({ ok: false, error: "Admin access required." }, 403);

        const id = new URL(request.url).searchParams.get("id");
        const categories = await categoryRepository.tree();

        if (!id) return json({ ok: true, categories });

        // getByIdForAdmin: unticking Published must not make a product
        // unreachable from its own editor. That trap is why the checkbox
        // was withheld until now.
        const product = await productRepository.getByIdForAdmin(id);
        if (!product) return json({ ok: false, error: "Product not found." }, 404);

        return json({ ok: true, categories, product });
      },

      /**
       * DELETE /api/admin/product?id=…&confirm=<the product's exact name>
       *
       * THE NAME IS THE CONFIRMATION, and it is checked on the SERVER rather
       * than only in the dialog. A destructive endpoint whose only guard is a
       * modal is a destructive endpoint with no guard: anything that can send
       * a request can skip the modal. Requiring the caller to already know
       * the exact name means a mistyped or guessed id cannot destroy anything.
       *
       * Order history is untouched by this — see the note on `deleteProduct`.
       */
      DELETE: async ({ request }) => {
        const admin = await adminFromRequest(request);
        if (!admin) return json({ ok: false, error: "Admin access required." }, 403);

        const url = new URL(request.url);
        const id = str(url.searchParams.get("id"));
        const confirm = str(url.searchParams.get("confirm"));
        if (!id) return fail("Which product?");

        const product = await productRepository.getByIdForAdmin(id);
        if (!product) return json({ ok: false, error: "Product not found." }, 404);

        if (confirm !== product.name) {
          return json(
            {
              ok: false,
              error: `Type the product's name exactly to delete it: ${product.name}`,
            },
            409,
          );
        }

        try {
          const deleted = await productRepository.deleteProduct(id);
          if (!deleted) return json({ ok: false, error: "Product not found." }, 404);
          return json({ ok: true, deleted: product.name });
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "The product could not be deleted.";
          if (message.includes("SUPABASE_SERVICE_ROLE_KEY")) {
            return json(
              {
                ok: false,
                error:
                  "The shop cannot write to its own catalogue: the server is missing its " +
                  "database key. Nothing was deleted.",
              },
              503,
            );
          }
          return json({ ok: false, error: message }, 500);
        }
      },

      POST: async ({ request }) => {
        const admin = await adminFromRequest(request);
        if (!admin) return json({ ok: false, error: "Admin access required." }, 403);

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return fail("Send a JSON body.");
        }

        const parsed = parse(body);
        if (typeof parsed === "string") return fail(parsed);

        try {
          const product = await productRepository.saveProduct(parsed.input, parsed.id);
          return json({ ok: true, product });
        } catch (error) {
          // saveProduct's own messages are already written for a shopkeeper
          // (duplicate slug, for instance), so they are passed through rather
          // than replaced with a generic failure.
          const message =
            error instanceof Error ? error.message : "The product could not be saved.";

          // The one exception. Writing the catalogue needs the service role,
          // and when that key is unset the raw message names an environment
          // variable — true, and useless to the person holding the garment.
          if (message.includes("SUPABASE_SERVICE_ROLE_KEY")) {
            return json(
              {
                ok: false,
                error:
                  "The shop cannot write to its own catalogue: the server is missing its database key. " +
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
