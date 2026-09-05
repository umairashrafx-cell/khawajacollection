/**
 * Categories.
 *
 * THE SCREEN IS THE TREE. Not a table with a "parent" column — the shape of a
 * taxonomy is the whole point of it, and a shopkeeper deciding where "Quilt
 * Covers" belongs is answering a question about the shape. So the list is
 * indented, each department carries its own "Add a subcategory" button, and
 * the form opens in place under the thing it will be added to.
 *
 * WHAT IT SHOWS BESIDE EACH NAME IS THE PRODUCT COUNT, because the one fact
 * you need before touching a category is whether anything is in it. An empty
 * one is safe to rename; a category with forty products in it is a page people
 * have bookmarked.
 *
 * WHAT IT WILL NOT DO IS DELETE OR MOVE. Deleting a category orphans every
 * product pointing at it, and moving one changes its slug, which is its URL.
 * Neither is offered, and the API refuses both independently.
 */

import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ChevronRight, FolderPlus, ImagePlus, Loader2, Pencil, Plus } from "lucide-react";

import { AppLink } from "@/components/layout/AppLink";
import {
  fetchAdminCategories,
  saveCategory,
  type AdminCategoryNode,
  type CategorySaveInput,
} from "@/lib/auth/admin-api";
import { uploadCategoryImage } from "@/lib/auth/image-upload";
import { useAdminAccess } from "@/hooks/useAdminAccess";

export const Route = createFileRoute("/admin/categories")({
  head: () => ({
    meta: [{ title: "Categories | Admin" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: AdminCategories,
});

const FIELD =
  "min-h-11 w-full border border-kc-line bg-kc-white px-3 text-sm text-kc-ink placeholder:text-kc-muted";
const LABEL = "block text-xs uppercase tracking-[0.12em] text-kc-charcoal";

/** Matches the server's rule, so the preview under the field is the truth. */
function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

type FormState =
  | { mode: "new"; parentSlug: string | null }
  | {
      mode: "edit";
      parentSlug: string | null;
      slug: string;
      name: string;
      description: string;
      imageUrl: string | null;
    };

function AdminCategories() {
  const queryClient = useQueryClient();
  const { isAdmin } = useAdminAccess();
  const [form, setForm] = useState<FormState | null>(null);

  const { data, isPending, error } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: fetchAdminCategories,
    enabled: isAdmin,
    staleTime: 30_000,
  });

  const mutation = useMutation({
    mutationFn: (input: CategorySaveInput) => saveCategory(input),
    onSuccess: () => {
      setForm(null);
      void queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      // The product form's category list came from the same table.
      void queryClient.invalidateQueries({ queryKey: ["admin-product-form"] });
    },
  });

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-kc-ink">Categories</h1>
          <p className="mt-1 text-sm text-kc-muted">
            A new department needs a page before it can be linked. See the note below.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setForm({ mode: "new", parentSlug: null })}
          className="flex min-h-11 items-center gap-2 bg-kc-ink px-5 text-sm tracking-wide text-kc-paper"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add department
        </button>
      </div>

      {error ? (
        <p role="alert" className="mt-6 text-sm text-kc-sale">
          {error instanceof Error ? error.message : "Could not load categories."}
        </p>
      ) : null}

      {form?.mode === "new" && form.parentSlug === null ? (
        <div className="mt-5">
          <CategoryForm
            parentSlug={null}
            parentName={null}
            saving={mutation.isPending}
            error={mutation.error instanceof Error ? mutation.error.message : null}
            onCancel={() => setForm(null)}
            onSubmit={(input) => mutation.mutate(input)}
          />
        </div>
      ) : null}

      {isPending ? <p className="mt-6 text-sm text-kc-muted">Loading…</p> : null}

      {data ? (
        <ul className="mt-6 space-y-4">
          {data.categories.map((parent) => (
            <li key={parent.slug} className="border border-kc-line bg-kc-white">
              <Row
                node={parent}
                href={`/${parent.slug}`}
                onEdit={() =>
                  setForm({
                    mode: "edit",
                    parentSlug: null,
                    slug: parent.slug,
                    name: parent.name,
                    description: parent.description ?? "",
                    imageUrl: parent.imageUrl,
                  })
                }
              />

              <ul className="border-t border-kc-line">
                {parent.children.map((child) => (
                  <li key={child.slug} className="border-b border-kc-line/60 last:border-b-0">
                    <Row
                      node={child}
                      nested
                      href={`/${parent.slug}/${child.segment}`}
                      onEdit={() =>
                        setForm({
                          mode: "edit",
                          parentSlug: parent.slug,
                          slug: child.slug,
                          name: child.name,
                          description: child.description ?? "",
                          imageUrl: child.imageUrl,
                        })
                      }
                    />
                  </li>
                ))}
              </ul>

              <div className="border-t border-kc-line p-3">
                {form?.mode === "new" && form.parentSlug === parent.slug ? (
                  <CategoryForm
                    parentSlug={parent.slug}
                    parentName={parent.name}
                    saving={mutation.isPending}
                    error={mutation.error instanceof Error ? mutation.error.message : null}
                    onCancel={() => setForm(null)}
                    onSubmit={(input) => mutation.mutate(input)}
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setForm({ mode: "new", parentSlug: parent.slug })}
                    className="flex min-h-11 items-center gap-2 px-1 text-sm text-kc-charcoal hover:text-kc-ink"
                  >
                    <FolderPlus className="h-4 w-4" aria-hidden="true" />
                    Add a subcategory under {parent.name}
                  </button>
                )}
              </div>

              {form?.mode === "edit" &&
              (form.slug === parent.slug ||
                parent.children.some((child) => child.slug === form.slug)) ? (
                <div className="border-t border-kc-line p-3">
                  <CategoryForm
                    // Remounts when you switch from renaming one child to
                    // another, so the fields do not keep the previous name.
                    key={form.slug}
                    parentSlug={form.parentSlug}
                    parentName={form.parentSlug ? parent.name : null}
                    editing={{
                      slug: form.slug,
                      name: form.name,
                      description: form.description,
                      imageUrl: form.imageUrl,
                    }}
                    saving={mutation.isPending}
                    error={mutation.error instanceof Error ? mutation.error.message : null}
                    onCancel={() => setForm(null)}
                    onSubmit={(input) => mutation.mutate(input)}
                  />
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      {/*
       * The honest caveat, on the screen rather than in a file nobody opens.
       * Subcategories work immediately because /women/$subcategory resolves the
       * segment against this table. A brand new DEPARTMENT has no route file,
       * so its page is a 404 until one is added — better said out loud here
       * than discovered by a customer.
       */}
      <p className="mt-8 max-w-prose border border-kc-line bg-kc-white p-4 text-sm text-kc-charcoal">
        <strong className="font-medium text-kc-ink">Subcategories work straight away</strong> — a
        new one under Women is live at its address the moment you save it, and appears in the
        product form.{" "}
        <strong className="font-medium text-kc-ink">A new department does not.</strong> It needs its
        own page and a place in the main menu, which is a code change. Add it here, then ask for the
        page.
      </p>
    </div>
  );
}

function Row({
  node,
  href,
  nested,
  onEdit,
}: {
  node: { slug: string; name: string; productCount: number };
  href: string;
  nested?: boolean;
  onEdit: () => void;
}) {
  return (
    <div
      className={`flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 ${nested ? "pl-9" : ""}`}
    >
      {nested ? (
        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-kc-muted" aria-hidden="true" />
      ) : null}
      <AppLink
        href={href}
        className={`text-sm underline-offset-4 hover:underline ${
          nested ? "text-kc-charcoal" : "font-medium text-kc-ink"
        }`}
      >
        {node.name}
      </AppLink>
      <code className="text-xs text-kc-muted">{href}</code>
      <span className="ml-auto text-xs text-kc-muted">
        {node.productCount === 1 ? "1 product" : `${node.productCount} products`}
      </span>
      <button
        type="button"
        onClick={onEdit}
        className="flex min-h-11 items-center gap-1.5 text-xs text-kc-charcoal underline-offset-4 hover:underline"
      >
        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
        Rename<span className="sr-only"> {node.name}</span>
      </button>
    </div>
  );
}

function CategoryForm({
  parentSlug,
  parentName,
  editing,
  saving,
  error,
  onSubmit,
  onCancel,
}: {
  parentSlug: string | null;
  parentName: string | null;
  editing?: { slug: string; name: string; description: string; imageUrl: string | null };
  saving: boolean;
  error: string | null;
  onSubmit: (input: CategorySaveInput) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(editing?.name ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [imageUrl, setImageUrl] = useState<string | null>(editing?.imageUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // What the address will actually be, shown while it is still changeable.
  const segment = editing
    ? editing.slug.replace(parentSlug ? `${parentSlug}-` : "", "")
    : slugify(name);
  const href = parentSlug ? `/${parentSlug}/${segment}` : `/${segment}`;

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({
          name,
          parentSlug,
          description,
          // Omitted when unchanged, so the API keeps whatever card is there
          // rather than clearing it on every rename.
          ...(imageUrl && imageUrl !== editing?.imageUrl ? { imageUrl } : {}),
          ...(editing ? { segment, allowRename: true } : {}),
        });
      }}
      className="space-y-3 border border-kc-line bg-kc-sand p-4"
    >
      <p className="text-xs uppercase tracking-[0.12em] text-kc-muted">
        {editing
          ? `Rename ${editing.name}`
          : parentName
            ? `New subcategory under ${parentName}`
            : "New department"}
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className={LABEL}>Name</span>
          <input
            type="text"
            required
            autoFocus
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={parentName ? "Quilt Covers" : "Bedsheets"}
            className={`${FIELD} mt-1.5`}
          />
        </label>

        <label className="block">
          <span className={LABEL}>Web address</span>
          <span className="mt-1.5 flex min-h-11 items-center border border-kc-line bg-kc-white px-3 text-sm text-kc-muted">
            {segment ? href : "—"}
          </span>
        </label>
      </div>

      {/*
        THE CARD, not "an image". This is the 4:5 tile on the homepage's Shop
        by Category strip, and saying which picture it is stops someone
        uploading a product shot and wondering where it went. Cropped to 4:5
        in the browser before upload, for the same reason product photos are
        cropped to 3:4 — the grid reserves the frame and a different ratio
        reintroduces the layout shift.
      */}
      <div>
        <span className={LABEL}>Homepage card</span>
        <span className="mt-0.5 block text-xs text-kc-muted">
          The 4:5 picture on the Shop by category tiles. Without one, the generated KC placeholder
          is used.
        </span>
        <div className="mt-1.5 flex items-start gap-3">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt=""
              width={96}
              height={120}
              className="h-[120px] w-24 shrink-0 border border-kc-line object-cover"
            />
          ) : (
            <div className="flex h-[120px] w-24 shrink-0 items-center justify-center border border-dashed border-kc-line text-[10px] uppercase tracking-wide text-kc-muted">
              None
            </div>
          )}
          <div>
            <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 border border-kc-line bg-kc-white px-4 text-sm text-kc-ink">
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <ImagePlus className="h-4 w-4" aria-hidden="true" />
              )}
              {uploading ? "Uploading…" : imageUrl ? "Replace picture" : "Choose picture"}
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                disabled={uploading}
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  event.target.value = "";
                  if (!file) return;
                  setUploadError(null);
                  setUploading(true);
                  try {
                    const uploaded = await uploadCategoryImage(file, segment || slugify(name));
                    setImageUrl(uploaded.url);
                  } catch (cause) {
                    setUploadError(cause instanceof Error ? cause.message : "That upload failed.");
                  } finally {
                    setUploading(false);
                  }
                }}
              />
            </label>
            {uploadError ? (
              <p role="alert" className="mt-2 text-xs text-kc-sale">
                {uploadError}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <label className="block">
        <span className={LABEL}>Description</span>
        <span className="mt-0.5 block text-xs text-kc-muted">
          Shown under the heading on the listing page, and to Google.
        </span>
        <textarea
          rows={2}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className={`${FIELD} mt-1.5 py-2`}
        />
      </label>

      {editing ? (
        <p className="text-xs text-kc-muted">
          The address stays {href} — renaming never moves a page that people have already linked to.
        </p>
      ) : null}

      {error ? (
        <p role="alert" className="border border-kc-sale bg-kc-white p-3 text-sm text-kc-sale">
          {error}
        </p>
      ) : null}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="flex min-h-11 items-center gap-2 bg-kc-ink px-5 text-sm tracking-wide text-kc-paper disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
          {editing ? "Save name" : "Create"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="min-h-11 border border-kc-line px-4 text-sm text-kc-ink"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
