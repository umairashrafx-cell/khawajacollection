/**
 * Stock.
 *
 * THE DESIGN PROBLEM HERE IS TRUST, not layout. Someone stands at a counter
 * editing two dozen small numbers, and the failure that matters is not knowing
 * whether a change saved. So:
 *
 *   - Each variant saves on its own, on blur or Enter. No "Save all" button
 *     that can be forgotten, and no autosave-per-keystroke that fires four
 *     requests while you type "12".
 *   - A saved row says so, briefly and per row. A row that failed says so and
 *     KEEPS the typed value, so the number is not lost along with the error.
 *   - The number is never silently coerced. An emptied input does not become
 *     zero — zero means sold out, and inventing that is how a piece disappears
 *     from the shop for a week before anyone notices.
 *
 * Products are grouped with their variants because stock is a per-variant fact
 * that people think about per product: "how many Gulbahar are left" is really
 * "what do S, M and L say".
 */

import { createFileRoute } from "@tanstack/react-router";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Check, Search } from "lucide-react";

import { AppLink } from "@/components/layout/AppLink";
import {
  fetchAdminProducts,
  updateVariantStock,
  type AdminProduct,
  type AdminVariant,
} from "@/lib/auth/admin-api";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import { formatPKR } from "@/lib/format";

export const Route = createFileRoute("/admin/products")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search["q"] === "string" ? search["q"] : undefined,
    filter: typeof search["filter"] === "string" ? search["filter"] : undefined,
    page: Number(search["page"]) > 1 ? Number(search["page"]) : undefined,
  }),
  head: () => ({
    meta: [{ title: "Stock | Admin" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: AdminProducts,
});

function AdminProducts() {
  const { q, filter, page } = Route.useSearch();
  const navigate = Route.useNavigate();
  // Server-authoritative, so these queries still fire for an admin whose
  // token predates the role. See src/hooks/useAdminAccess.ts.
  const { isAdmin } = useAdminAccess();
  const [term, setTerm] = useState(q ?? "");

  const { data, isPending, error, isPlaceholderData } = useQuery({
    queryKey: ["admin-products", q, filter, page],
    queryFn: () => fetchAdminProducts({ q, filter, page }),
    enabled: isAdmin,
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.perPage)) : 1;
  const current = page ?? 1;

  return (
    <div>
      <h1 className="font-display text-2xl text-kc-ink">Stock</h1>
      <p className="mt-1 text-sm text-kc-muted">
        Changes save as you leave each box. Prices are not editable here.
      </p>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void navigate({
            search: (prev) => ({ ...prev, q: term.trim() || undefined, page: undefined }),
          });
        }}
        className="mt-5 flex gap-2"
        role="search"
      >
        <label htmlFor="admin-product-search" className="sr-only">
          Search products
        </label>
        <input
          id="admin-product-search"
          type="search"
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          placeholder="Product, fabric or colour"
          className="min-h-11 w-full max-w-sm border border-kc-line bg-kc-white px-3 text-sm text-kc-ink"
        />
        <button
          type="submit"
          className="flex min-h-11 items-center gap-2 bg-kc-ink px-4 text-sm text-kc-paper"
        >
          <Search className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only sm:not-sr-only">Search</span>
        </button>
      </form>

      {data ? (
        <nav aria-label="Filter stock" className="mt-4 flex flex-wrap gap-2">
          {[
            { key: undefined, label: "All" },
            {
              key: "low",
              label: `Low stock (${data.summary.lowStockVariants})`,
            },
            {
              key: "soldout",
              // Counts SIZES, matching what the filter now selects. Counting
              // whole products showed “Sold out (0)” directly above a product
              // with an empty size, which is the opposite of useful.
              label: `Sold out (${data.summary.soldOutVariants})`,
            },
          ].map((chip) => {
            const active = filter === chip.key;
            return (
              <AppLink
                key={chip.label}
                href={chip.key ? `/admin/products?filter=${chip.key}` : "/admin/products"}
                {...(active ? { "aria-current": "page" as const } : {})}
                className={`flex min-h-11 items-center whitespace-nowrap border px-3 text-sm transition-colors ${
                  active
                    ? "border-kc-ink bg-kc-ink text-kc-paper"
                    : "border-kc-line bg-kc-white text-kc-charcoal hover:border-kc-ink"
                }`}
              >
                {chip.label}
              </AppLink>
            );
          })}
        </nav>
      ) : null}

      {error ? (
        <p role="alert" className="mt-6 text-sm text-kc-sale">
          {error instanceof Error ? error.message : "Could not load products."}
        </p>
      ) : null}

      {isPending ? <p className="mt-6 text-sm text-kc-muted">Loading…</p> : null}

      {data && data.products.length === 0 ? (
        <p className="mt-6 border border-kc-line bg-kc-white p-5 text-sm text-kc-charcoal">
          Nothing matches that search.
        </p>
      ) : null}

      {data && data.products.length > 0 ? (
        <>
          <ul className={`mt-6 space-y-4 ${isPlaceholderData ? "opacity-60" : ""}`}>
            {data.products.map((product) => (
              <ProductStock key={product.id} product={product} />
            ))}
          </ul>

          {totalPages > 1 ? (
            <div className="mt-6 flex items-center justify-between text-sm">
              <p className="text-kc-muted">
                Page {current} of {totalPages} · {data.total} products
              </p>
              <div className="flex gap-2">
                <AppLink
                  href={`/admin/products?${new URLSearchParams({
                    ...(q ? { q } : {}),
                    ...(current > 2 ? { page: String(current - 1) } : {}),
                  })}`}
                  aria-disabled={current === 1}
                  className={`flex min-h-11 items-center border border-kc-line px-4 ${
                    current === 1 ? "pointer-events-none opacity-40" : "hover:border-kc-ink"
                  }`}
                >
                  Previous
                </AppLink>
                <AppLink
                  href={`/admin/products?${new URLSearchParams({
                    ...(q ? { q } : {}),
                    page: String(current + 1),
                  })}`}
                  aria-disabled={current >= totalPages}
                  className={`flex min-h-11 items-center border border-kc-line px-4 ${
                    current >= totalPages ? "pointer-events-none opacity-40" : "hover:border-kc-ink"
                  }`}
                >
                  Next
                </AppLink>
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

function ProductStock({ product }: { product: AdminProduct }) {
  const soldOut = product.totalStock === 0;

  return (
    <li className="border border-kc-line bg-kc-white">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-kc-line px-4 py-3">
        <AppLink
          href={`/products/${product.slug}`}
          className="text-sm font-medium text-kc-ink underline-offset-4 hover:underline"
        >
          {product.name}
        </AppLink>
        <span className="kc-price text-xs text-kc-muted">{formatPKR(product.price)}</span>
        <span
          className={`ml-auto text-xs ${soldOut ? "font-medium text-kc-sale" : "text-kc-muted"}`}
        >
          {soldOut ? "Sold out" : `${product.totalStock} in stock`}
        </span>
      </div>

      <ul className="divide-y divide-kc-line">
        {product.variants.map((variant) => (
          <VariantRow key={variant.id} variant={variant} />
        ))}
      </ul>
    </li>
  );
}

function VariantRow({ variant }: { variant: AdminVariant }) {
  const queryClient = useQueryClient();
  const [value, setValue] = useState(String(variant.stock));
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: (stock: number) => updateVariantStock(variant.id, stock),
    onSuccess: () => {
      setError(null);
      setSaved(true);
      // Long enough to notice, short enough not to linger over the next edit.
      setTimeout(() => setSaved(false), 2000);
      void queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    },
    onError: (e: Error) => {
      setSaved(false);
      // The typed value is deliberately NOT reverted — losing the number the
      // person just entered, on top of failing to save it, is two failures.
      setError(e.message);
    },
  });

  function commit() {
    const trimmed = value.trim();
    // An empty box is not zero. Zero means sold out, and guessing that is how
    // a piece silently vanishes from the shop.
    if (trimmed === "") {
      setValue(String(variant.stock));
      setError(null);
      return;
    }

    const next = Number(trimmed);
    if (!Number.isFinite(next) || next < 0) {
      setError("Enter 0 or more.");
      return;
    }
    if (next === variant.stock) {
      setError(null);
      return;
    }
    save.mutate(Math.trunc(next));
  }

  const label = `${variant.size}${variant.colorName ? ` · ${variant.colorName}` : ""}`;

  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5">
      <span className="min-w-0 flex-1 text-sm text-kc-charcoal">
        {label}
        <span className="kc-price ml-2 text-xs text-kc-muted">{variant.sku}</span>
      </span>

      <label htmlFor={`stock-${variant.id}`} className="sr-only">
        Stock for {label}
      </label>
      <input
        id={`stock-${variant.id}`}
        type="number"
        min={0}
        inputMode="numeric"
        value={value}
        disabled={save.isPending}
        onChange={(event) => {
          setValue(event.target.value);
          setSaved(false);
        }}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            event.currentTarget.blur();
          }
        }}
        {...(error ? { "aria-invalid": true, "aria-describedby": `stock-err-${variant.id}` } : {})}
        className={`min-h-11 w-20 border bg-kc-white px-2 text-right text-sm text-kc-ink ${
          error ? "border-kc-sale" : "border-kc-line"
        }`}
      />

      {/* Polite: a screen reader should hear "saved" without being interrupted. */}
      <span aria-live="polite" className="w-16 text-xs">
        {save.isPending ? (
          <span className="text-kc-muted">Saving…</span>
        ) : saved ? (
          <span className="inline-flex items-center gap-1 text-kc-ink">
            <Check className="h-3.5 w-3.5" aria-hidden="true" />
            Saved
          </span>
        ) : null}
      </span>

      {error ? (
        <span id={`stock-err-${variant.id}`} role="alert" className="w-full text-xs text-kc-sale">
          {error}
        </span>
      ) : null}
    </li>
  );
}
