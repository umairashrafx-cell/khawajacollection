/**
 * The one screen that puts a product on the shop.
 *
 * DESIGN INTENT. This is the longest form in the project and it is filled in by
 * someone standing behind a counter, on a phone as often as a laptop, holding
 * the garment. Three decisions follow from that:
 *
 *   1. IT IS ORDERED THE WAY THE JOB IS DONE — photographs first, then what the
 *      thing is, then what it costs, then what sizes exist. Not the order of
 *      the database table.
 *   2. NOTHING IS GUESSED SILENTLY. The slug is derived from the name, the SKU
 *      from the slug and size, but both are shown in an editable box, so the
 *      derivation is visible and overridable. A form that quietly invents a URL
 *      is a form you cannot trust with the next one.
 *   3. ONE SAVE, AND IT TELLS YOU WHAT WENT WRONG IN WORDS. The server returns
 *      sentences ("The sale price has to be lower than the price"), and they are
 *      shown verbatim at the top and focused, rather than mapped onto red
 *      outlines that leave you hunting.
 *
 * NUMBERS ARE HELD AS STRINGS. `price` here is "2499", not 2499. An
 * <input type="number"> hands you "" mid-edit, and Number("") is 0 — storing
 * that would list the piece free while someone retypes a digit. They convert
 * once, on the server, where a bad value is refused with a sentence.
 *
 * WHAT THIS FORM DELIBERATELY DOES NOT DO.
 *
 * It cannot DELETE a product. Deleting breaks every order that referenced the
 * piece, and an order history with holes in it is worse than a shelf with an
 * old kurta on it.
 *
 * IT CAN UNPUBLISH ONE, AND THAT IS WHAT "REMOVE" SHOULD MEAN HERE. Unticking
 * Published takes the piece off the shop, out of search and out of the
 * sitemap, while leaving it fully visible and editable in the admin and
 * leaving every past order that referenced it intact.
 *
 * It could not do this until the admin gained a read path that bypasses the
 * `is_active` filter in 0002_rls.sql (`listForAdmin` / `getByIdForAdmin`).
 * Without those, unticking the box would have hidden the product from this
 * very form at the same moment — a checkbox that hides a product from its own
 * editor is a trap, which is why it was withheld rather than shipped broken.
 *
 * ONE HONEST LIMIT, MEASURED IN PRODUCTION RATHER THAN ASSUMED. Unpublishing
 * takes effect IMMEDIATELY everywhere that is rendered per request — search,
 * the sitemap, and the checkout, which refuses the item with a 409 — but the
 * listing pages and the product page itself are PRERENDERED at build time, so
 * a direct hit on one of those URLs keeps serving the old HTML until the next
 * deploy. It cannot be bought from that stale page: /api/orders resolves every
 * line through RLS and gets nothing back. Verified by unpublishing a live
 * product, attempting to order it, and getting "One of these pieces is no
 * longer available."
 *
 * Excluding /products/** from the prerender would close the gap and would slow
 * the first byte on all seventy-odd product pages to fix a stale page nobody
 * should be visiting. Not worth it. Redeploy if it matters.
 *
 * It has no COLLECTIONS field. Collections are curated across products rather
 * than per product, so they belong on a screen of their own rather than as a
 * checkbox list that grows forever.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";

import { ImageUploader } from "./ImageUploader";
import type { AdminCategory, ProductFormValues } from "@/lib/auth/admin-api";

interface Props {
  categories: AdminCategory[];
  initial: ProductFormValues;
  /** Present when editing; the heading and button copy change with it. */
  editing: boolean;
  saving: boolean;
  error: string | null;
  onSubmit: (values: ProductFormValues) => void;
  onCancel: () => void;
}

export const EMPTY_PRODUCT: ProductFormValues = {
  slug: "",
  name: "",
  description: "",
  shortDescription: "",
  price: "",
  salePrice: "",
  categorySlug: "",
  subcategorySlug: "",
  fabric: "",
  pieces: "",
  care: "",
  tags: "",
  isFeatured: false,
  isNewArrival: true,
  isMadeToOrder: false,
  isActive: true,
  images: [],
  variants: [{ sku: "", size: "S", colorName: "", colorHex: "#F3EFE7", stock: "0" }],
};

/** Matches the server's `normaliseSlug`, so what you see is what is saved. */
function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** KC-GULBAHAR-M. Readable on a packing slip, which is where it is read. */
function suggestSku(slug: string, size: string): string {
  const stem = slugify(slug).split("-").slice(0, 2).join("-");
  return `KC-${stem}-${slugify(size)}`.toUpperCase();
}

const FIELD =
  "min-h-11 w-full border border-kc-line bg-kc-white px-3 text-sm text-kc-ink placeholder:text-kc-muted";
const LABEL = "block text-xs uppercase tracking-[0.12em] text-kc-charcoal";

/**
 * A labelled field.
 *
 * THE HINT IS DELIBERATELY OUTSIDE THE LABEL, joined back on with
 * aria-describedby. Wrapping the control in a <label> that also contains the
 * hint is shorter to write, but it folds the hint into the control's
 * accessible NAME rather than its description — so the character counter below
 * makes the short-description box rename itself on every keystroke, and a
 * screen reader announces the new name each time. Described-by text is
 * announced once, after the name, which is what a hint is for.
 */
function Field({
  id,
  label,
  hint,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className={LABEL}>
        {label}
      </label>
      {hint ? (
        <p id={`${id}-hint`} className="mt-0.5 text-xs text-kc-muted">
          {hint}
        </p>
      ) : null}
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border border-kc-line bg-kc-white p-4 sm:p-5">
      <h2 className="font-display text-lg text-kc-ink">{title}</h2>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

export function ProductForm({
  categories,
  initial,
  editing,
  saving,
  error,
  onSubmit,
  onCancel,
}: Props) {
  const [values, setValues] = useState<ProductFormValues>(initial);
  /*
   * Once the name has produced a slug, the slug stops following the name.
   * Renaming a product that is already live must not silently move its URL and
   * 404 every link to it — including the ones in Google.
   */
  const [slugLocked, setSlugLocked] = useState(editing);
  const errorRef = useRef<HTMLParagraphElement>(null);

  // The server's refusal is the one thing that must not be missed, so focus
  // goes to it. Without this the page looks unchanged after pressing Save.
  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);

  function set<K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  const subcategories = useMemo(
    () => categories.find((category) => category.slug === values.categorySlug)?.children ?? [],
    [categories, values.categorySlug],
  );

  const shortLength = values.shortDescription.length;

  function setVariant(index: number, patch: Partial<ProductFormValues["variants"][number]>) {
    setValues((prev) => {
      const variants = [...prev.variants];
      const current = variants[index];
      if (!current) return prev;
      variants[index] = { ...current, ...patch };
      return { ...prev, variants };
    });
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        // Alt text falls back to the product name here rather than being left
        // empty: an undescribed product photo fails Section 15, and the person
        // filling this in has better things to type eight times.
        onSubmit({
          ...values,
          slug: slugify(values.slug || values.name),
          images: values.images.map((image) => ({
            url: image.url,
            alt: image.alt.trim() || values.name,
          })),
        });
      }}
      className="space-y-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-kc-ink">
            {editing ? values.name || "Edit product" : "New product"}
          </h1>
          <p className="mt-1 text-sm text-kc-muted">
            {editing
              ? "Saving replaces what is on the shop straight away."
              : "It goes on the shop as soon as you save, unless you untick Published."}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="min-h-11 border border-kc-line px-4 text-sm text-kc-ink"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex min-h-11 items-center gap-2 bg-kc-ink px-6 text-sm tracking-wide text-kc-paper disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
            {editing ? "Save changes" : "Add product"}
          </button>
        </div>
      </div>

      {error ? (
        <p
          ref={errorRef}
          tabIndex={-1}
          role="alert"
          className="border border-kc-sale bg-kc-white p-3 text-sm text-kc-sale"
        >
          {error}
        </p>
      ) : null}

      <Section title="Photographs">
        <ImageUploader
          images={values.images}
          onChange={(images) => set("images", images)}
          slug={values.slug || slugify(values.name)}
        />
      </Section>

      <Section title="What it is">
        <Field id="pf-name" label="Name">
          <input
            id="pf-name"
            type="text"
            required
            value={values.name}
            onChange={(event) => {
              const name = event.target.value;
              setValues((prev) => ({
                ...prev,
                name,
                ...(slugLocked ? {} : { slug: slugify(name) }),
              }));
            }}
            placeholder="Gulbahar Embroidered Lawn"
            className={FIELD}
          />
        </Field>

        <Field id="pf-slug" label="Web address" hint="khawajacollection.com/products/…">
          <input
            id="pf-slug"
            aria-describedby="pf-slug-hint"
            type="text"
            value={values.slug}
            onChange={(event) => {
              setSlugLocked(true);
              set("slug", event.target.value);
            }}
            onBlur={(event) => set("slug", slugify(event.target.value))}
            placeholder="gulbahar-embroidered-lawn"
            className={FIELD}
          />
        </Field>

        <Field
          id="pf-short"
          label="Short description"
          hint={`Shown on Google and in previews. ${shortLength}/160 characters.`}
        >
          <textarea
            id="pf-short"
            aria-describedby="pf-short-hint"
            required
            rows={2}
            maxLength={160}
            value={values.shortDescription}
            onChange={(event) => set("shortDescription", event.target.value)}
            placeholder="Three-piece embroidered lawn with a chiffon dupatta."
            className={`${FIELD} py-2`}
          />
        </Field>

        <Field id="pf-description" label="Full description" hint="Shown on the product page.">
          <textarea
            id="pf-description"
            aria-describedby="pf-description-hint"
            rows={5}
            value={values.description}
            onChange={(event) => set("description", event.target.value)}
            className={`${FIELD} py-2`}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="pf-category" label="Category">
            <select
              id="pf-category"
              required
              value={values.categorySlug}
              onChange={(event) =>
                setValues((prev) => ({
                  ...prev,
                  categorySlug: event.target.value,
                  // A subcategory of the old category would point nowhere.
                  subcategorySlug: "",
                }))
              }
              className={FIELD}
            >
              <option value="">Choose…</option>
              {categories.map((category) => (
                <option key={category.slug} value={category.slug}>
                  {category.name}
                </option>
              ))}
            </select>
          </Field>

          <Field id="pf-subcategory" label="Subcategory" hint="Optional.">
            <select
              id="pf-subcategory"
              aria-describedby="pf-subcategory-hint"
              value={values.subcategorySlug}
              onChange={(event) => set("subcategorySlug", event.target.value)}
              disabled={subcategories.length === 0}
              className={`${FIELD} disabled:opacity-50`}
            >
              <option value="">None</option>
              {subcategories.map((child) => (
                <option key={child.slug} value={child.slug}>
                  {child.name}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field id="pf-fabric" label="Fabric">
            <input
              id="pf-fabric"
              type="text"
              value={values.fabric}
              onChange={(event) => set("fabric", event.target.value)}
              placeholder="Lawn"
              className={FIELD}
            />
          </Field>
          <Field id="pf-pieces" label="Pieces">
            <input
              id="pf-pieces"
              type="number"
              min={1}
              max={5}
              value={values.pieces}
              onChange={(event) => set("pieces", event.target.value)}
              placeholder="3"
              className={FIELD}
            />
          </Field>
          <Field id="pf-tags" label="Tags" hint="Comma separated.">
            <input
              id="pf-tags"
              aria-describedby="pf-tags-hint"
              type="text"
              value={values.tags}
              onChange={(event) => set("tags", event.target.value)}
              placeholder="unstitched, eid"
              className={FIELD}
            />
          </Field>
        </div>

        <Field id="pf-care" label="Care instructions">
          <input
            id="pf-care"
            type="text"
            value={values.care}
            onChange={(event) => set("care", event.target.value)}
            placeholder="Dry clean only"
            className={FIELD}
          />
        </Field>
      </Section>

      <Section title="Price">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="pf-price" label="Price (PKR)" hint="Whole rupees, no decimals.">
            <input
              id="pf-price"
              aria-describedby="pf-price-hint"
              type="number"
              required
              min={1}
              step={1}
              inputMode="numeric"
              value={values.price}
              onChange={(event) => set("price", event.target.value)}
              placeholder="4990"
              className={FIELD}
            />
          </Field>
          <Field
            id="pf-sale-price"
            label="Sale price (PKR)"
            hint="Leave empty if it is not on sale."
          >
            <input
              id="pf-sale-price"
              aria-describedby="pf-sale-price-hint"
              type="number"
              min={1}
              step={1}
              inputMode="numeric"
              value={values.salePrice}
              onChange={(event) => set("salePrice", event.target.value)}
              placeholder=""
              className={FIELD}
            />
          </Field>
        </div>
      </Section>

      <Section title="Sizes and stock">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-kc-line text-left text-xs uppercase tracking-[0.12em] text-kc-charcoal">
                <th scope="col" className="py-2 pr-3 font-normal">
                  Size
                </th>
                <th scope="col" className="py-2 pr-3 font-normal">
                  Colour
                </th>
                <th scope="col" className="py-2 pr-3 font-normal">
                  Shade
                </th>
                <th scope="col" className="py-2 pr-3 font-normal">
                  SKU
                </th>
                <th scope="col" className="py-2 pr-3 font-normal">
                  Stock
                </th>
                <th scope="col" className="py-2">
                  <span className="sr-only">Remove</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {values.variants.map((variant, index) => (
                <tr key={index} className="border-b border-kc-line/60">
                  <td className="py-2 pr-3">
                    <input
                      type="text"
                      required
                      value={variant.size}
                      onChange={(event) => setVariant(index, { size: event.target.value })}
                      onBlur={() => {
                        // Filled in on blur, not on every keystroke, so a SKU
                        // typed by hand is never overwritten mid-word.
                        if (!variant.sku.trim()) {
                          setVariant(index, {
                            sku: suggestSku(values.slug || values.name, variant.size),
                          });
                        }
                      }}
                      aria-label={`Size for row ${index + 1}`}
                      className={`${FIELD} min-w-[5rem]`}
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <input
                      type="text"
                      value={variant.colorName}
                      onChange={(event) => setVariant(index, { colorName: event.target.value })}
                      placeholder="Ivory"
                      aria-label={`Colour name for row ${index + 1}`}
                      className={`${FIELD} min-w-[7rem]`}
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <input
                      type="color"
                      value={variant.colorHex}
                      onChange={(event) => setVariant(index, { colorHex: event.target.value })}
                      aria-label={`Colour swatch for row ${index + 1}`}
                      className="h-11 w-14 border border-kc-line bg-kc-white p-1"
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <input
                      type="text"
                      required
                      value={variant.sku}
                      onChange={(event) => setVariant(index, { sku: event.target.value })}
                      aria-label={`SKU for row ${index + 1}`}
                      className={`${FIELD} min-w-[10rem] font-mono text-xs`}
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <input
                      type="number"
                      min={0}
                      step={1}
                      inputMode="numeric"
                      value={variant.stock}
                      onChange={(event) => setVariant(index, { stock: event.target.value })}
                      aria-label={`Stock for row ${index + 1}`}
                      className={`${FIELD} min-w-[5rem]`}
                    />
                  </td>
                  <td className="py-2">
                    <button
                      type="button"
                      onClick={() =>
                        setValues((prev) => ({
                          ...prev,
                          variants: prev.variants.filter((_, at) => at !== index),
                        }))
                      }
                      disabled={values.variants.length === 1}
                      className="flex h-11 w-11 items-center justify-center text-kc-charcoal hover:text-kc-sale disabled:opacity-30"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                      <span className="sr-only">Remove size row {index + 1}</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button
          type="button"
          onClick={() =>
            setValues((prev) => {
              const last = prev.variants[prev.variants.length - 1];
              return {
                ...prev,
                variants: [
                  ...prev.variants,
                  {
                    sku: "",
                    size: "",
                    // Colour carries over: most products are one colour in
                    // several sizes, so repeating it is the common case.
                    colorName: last?.colorName ?? "",
                    colorHex: last?.colorHex ?? "#F3EFE7",
                    stock: "0",
                  },
                ],
              };
            })
          }
          className="flex min-h-11 items-center gap-2 border border-kc-line px-4 text-sm text-kc-ink"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add a size
        </button>

        {editing ? (
          <p className="text-xs text-kc-muted">
            Removing a size row deletes that size. Set its stock to 0 instead if you expect it back.
          </p>
        ) : null}
      </Section>

      <Section title="Where it shows">
        <div className="grid gap-3 sm:grid-cols-2">
          {(
            [
              {
                key: "isActive",
                label: "Published",
                hint: "Untick to take it off the shop. It stays here, editable. Its own page keeps working until the next deploy, but it cannot be bought.",
              },
              { key: "isNewArrival", label: "New arrival", hint: "Shows in New In." },
              { key: "isFeatured", label: "Featured", hint: "Eligible for the homepage." },
              {
                key: "isMadeToOrder",
                label: "Made to order",
                hint: "Swaps Add to Bag for Enquire on WhatsApp.",
              },
            ] as const
          ).map((flag) => (
            <label
              key={flag.key}
              className="flex min-h-11 cursor-pointer items-start gap-3 border border-kc-line p-3"
            >
              <input
                type="checkbox"
                checked={values[flag.key]}
                onChange={(event) => set(flag.key, event.target.checked)}
                className="mt-0.5 h-5 w-5 accent-kc-ink"
              />
              <span>
                <span className="block text-sm text-kc-ink">{flag.label}</span>
                <span className="block text-xs text-kc-muted">{flag.hint}</span>
              </span>
            </label>
          ))}
        </div>
      </Section>

      <div className="flex justify-end gap-2 pb-4">
        <button
          type="button"
          onClick={onCancel}
          className="min-h-11 border border-kc-line px-4 text-sm text-kc-ink"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex min-h-11 items-center gap-2 bg-kc-ink px-6 text-sm tracking-wide text-kc-paper disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
          {editing ? "Save changes" : "Add product"}
        </button>
      </div>
    </form>
  );
}
