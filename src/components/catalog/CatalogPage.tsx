/**
 * The product listing page. See docs/BUILD-SPEC.pdf Section 11.2.
 *
 * Layout, in the order the spec gives: breadcrumbs, h1, one-line description,
 * then the result count and sort row. Desktop is a 280px sticky sidebar beside
 * a four-column grid; tablet drops to three columns with filters in a drawer;
 * mobile is two columns with a sticky Filter/Sort bar.
 *
 * /sale TONE — a documented narrowing. Phase 4 says "/sale gets the distinct
 * dark treatment from Section 11.1 item 9". That item describes a homepage
 * block: ink ground, white type, prominent discount badges. Inverting an entire
 * listing page would also invert the filter UI, where Section 15 contrast
 * cannot be met simultaneously for colour swatches, struck-through unavailable
 * sizes and the sale price colour. So /sale gets an ink header band and its
 * discount badges, and the filter and grid area stays on paper where every
 * control keeps its contrast.
 */

import { Suspense, lazy } from "react";

import { Container } from "@/components/layout/Container";
import { ProductGrid } from "@/components/product/ProductGrid";
import { usePlpNavigate, usePlpSearch } from "@/hooks/usePlpSearch";
import { crumbsFor, type CatalogData, type CatalogDescriptor } from "@/lib/catalog-page";
import { clearedSearch, hasActiveFilters } from "@/lib/plp-search";
import { useIsOverlayOpen } from "@/store/ui-store";
import { ActiveFilters } from "./ActiveFilters";
import { Breadcrumbs } from "./Breadcrumbs";
import { MobileFilterBar } from "./FilterDrawer";
import { FilterPanel } from "./FilterPanel";
import { Pagination } from "./Pagination";
import { SortDropdown } from "./SortDropdown";

// Phase 6 requires the filter drawer to be dynamically imported. It is mobile
// only and closed on arrival, so its chunk loads the first time Filter is
// tapped and never for a desktop visitor.
const FilterDrawer = lazy(() =>
  import("./FilterDrawer").then((module) => ({ default: module.FilterDrawer })),
);

export interface CatalogPageProps {
  descriptor: CatalogDescriptor;
  data: CatalogData;
}

export function CatalogPage({ descriptor, data }: CatalogPageProps) {
  const search = usePlpSearch();
  const navigate = usePlpNavigate();
  const inverse = descriptor.tone === "inverse";

  const lockedGroups: ("subcategory" | "collection")[] = [
    ...(descriptor.base.subcategory ? (["subcategory"] as const) : []),
    ...(descriptor.base.collection ? (["collection"] as const) : []),
  ];

  const filtersOpen = useIsOverlayOpen("filters");
  const activeCount = countActive(search);
  // Clamped so the range can never read backwards even if a stale page number
  // somehow survives the loader's redirect.
  const last = Math.min(data.page * data.perPage, data.total);
  const first = Math.min((data.page - 1) * data.perPage + 1, last);

  return (
    <>
      <div className={inverse ? "bg-kc-ink" : ""}>
        <Container>
          <div className="pt-8 pb-8 lg:pt-10 lg:pb-10">
            <Breadcrumbs crumbs={crumbsFor(descriptor)} tone={inverse ? "inverse" : "default"} />
            <h1
              className={`mt-4 font-display text-[28px] leading-tight md:text-[40px] ${
                inverse ? "text-kc-paper" : "text-kc-ink"
              }`}
            >
              {descriptor.h1}
            </h1>
            <p
              className={`mt-3 max-w-2xl text-sm ${
                inverse ? "text-kc-paper/75" : "text-kc-charcoal"
              }`}
            >
              {descriptor.description}
            </p>
          </div>
        </Container>
      </div>

      <Container>
        <div className="flex gap-10 pb-12 lg:pb-20">
          {/* Desktop: 280px sticky filter sidebar. */}
          <aside className="hidden w-[280px] shrink-0 lg:block">
            <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto pb-8">
              <h2 className="mb-4 font-display text-lg">Filter</h2>
              <FilterPanel
                facets={data.facets}
                {...(lockedGroups.length ? { lockedGroups } : {})}
              />
            </div>
          </aside>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-kc-line pb-4">
              <p className="text-sm text-kc-charcoal" aria-live="polite">
                {data.total === 0
                  ? "No products"
                  : `Showing ${first}–${last} of ${data.total} ${
                      data.total === 1 ? "product" : "products"
                    }`}
              </p>
              <div className="hidden lg:block">
                <SortDropdown />
              </div>
            </div>

            <div className="mt-5">
              <ActiveFilters facets={data.facets} />
            </div>

            {data.items.length === 0 ? (
              <EmptyState
                onClear={() => navigate(clearedSearch(search))}
                filtered={activeCount > 0}
              />
            ) : (
              <>
                <div className="mt-6">
                  <ProductGrid
                    products={data.items}
                    columns={{ mobile: 2, tablet: 3, desktop: 4 }}
                    priorityCount={2}
                  />
                </div>
                <div className="mt-12">
                  <Pagination page={data.page} totalPages={data.totalPages} />
                </div>
              </>
            )}
          </div>
        </div>
      </Container>

      <MobileFilterBar activeCount={activeCount} />
      {filtersOpen ? (
        <Suspense fallback={null}>
          <FilterDrawer
            facets={data.facets}
            total={data.total}
            {...(lockedGroups.length ? { lockedGroups } : {})}
          />
        </Suspense>
      ) : null}
    </>
  );
}

/** Section 11.2 — a clear message, the active filters, and a one-tap clear. */
function EmptyState({ onClear, filtered }: { onClear: () => void; filtered: boolean }) {
  return (
    <div className="mt-10 border border-kc-line bg-kc-white px-6 py-14 text-center">
      <h2 className="font-display text-xl text-kc-ink">Nothing matches those filters</h2>
      <p className="mx-auto mt-3 max-w-sm text-sm text-kc-charcoal">
        {filtered
          ? "The filters above are narrower than this listing. Remove one, or clear them all and start again."
          : "This listing is empty at the moment. Try another category."}
      </p>
      {filtered ? (
        <button
          type="button"
          onClick={onClear}
          className="mt-6 min-h-11 bg-kc-ink px-7 text-[12px] font-medium uppercase tracking-[0.08em] text-kc-paper transition-colors hover:bg-kc-charcoal"
        >
          Clear all filters
        </button>
      ) : null}
    </div>
  );
}

function countActive(search: ReturnType<typeof usePlpSearch>): number {
  if (!hasActiveFilters(search)) return 0;
  const { sort: _sort, page: _page, ...filters } = search;
  return Object.entries(filters).reduce((count, [, value]) => {
    if (typeof value === "string" && value.includes(",")) return count + value.split(",").length;
    return count + 1;
  }, 0);
}
