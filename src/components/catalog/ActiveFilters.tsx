/**
 * Applied-filter chips. See docs/BUILD-SPEC.pdf Section 11.2.
 * Each chip removes exactly its own filter; "Clear all" drops the lot but
 * keeps the chosen sort.
 */

import { X } from "lucide-react";

import { colors as COLOR_TOKENS, fabrics as FABRIC_TOKENS } from "@/config/filters";
import { usePlpNavigate, usePlpSearch } from "@/hooks/usePlpSearch";
import { formatPKR } from "@/lib/format";
import { clearedSearch, describeActiveFilters } from "@/lib/plp-search";
import type { Facets } from "@/types";

export function ActiveFilters({ facets }: { facets: Facets }) {
  const search = usePlpSearch();
  const navigate = usePlpNavigate();

  /**
   * Labels come from the static vocabulary first and the facets second. A
   * facet list can be empty precisely when a chip is showing — over-filter to
   * zero results and the fabric facet has nothing left in it — and a chip that
   * reads "velvet" instead of "Velvet" is exactly the case that breaks.
   */
  const labelFrom =
    (
      vocabulary: readonly { value: string; label: string }[],
      facetList: { value: string; label: string }[],
    ) =>
    (value: string) =>
      vocabulary.find((item) => item.value === value)?.label ??
      facetList.find((item) => item.value === value)?.label ??
      value;

  const chips = describeActiveFilters(
    search,
    {
      color: labelFrom(COLOR_TOKENS, facets.colors),
      fabric: labelFrom(FABRIC_TOKENS, facets.fabrics),
      collection: labelFrom([], facets.collections),
      subcategory: labelFrom([], facets.subcategories),
    },
    formatPKR,
  );

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <h2 className="sr-only">Applied filters</h2>
      {chips.map((chip) => (
        <button
          key={chip.id}
          type="button"
          onClick={() => navigate(chip.next)}
          className="flex items-center gap-1.5 border border-kc-line bg-kc-white px-3 py-1.5 text-xs text-kc-ink transition-colors hover:border-kc-ink"
        >
          {chip.label}
          <X className="h-3 w-3 text-kc-muted" aria-hidden="true" />
          <span className="sr-only">Remove filter</span>
        </button>
      ))}
      <button
        type="button"
        onClick={() => navigate(clearedSearch(search))}
        className="px-1 text-xs text-kc-charcoal underline underline-offset-4 hover:text-kc-ink"
      >
        Clear all
      </button>
    </div>
  );
}
