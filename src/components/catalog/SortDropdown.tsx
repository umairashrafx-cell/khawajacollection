/**
 * Sort control. See docs/BUILD-SPEC.pdf Sections 10.2 and 11.2.
 *
 * A native <select>: it is keyboard and screen-reader correct for free, and on
 * a phone it opens the platform picker, which beats any custom listbox here.
 * Changing it writes to the URL like every other filter.
 */

import { ChevronDown } from "lucide-react";

import { DEFAULT_SORT, sortOptions } from "@/config/filters";
import { usePlpNavigate, usePlpSearch } from "@/hooks/usePlpSearch";
import { withValue } from "@/lib/plp-search";
import type { ProductSort } from "@/types";

export function SortDropdown({ tone = "default" }: { tone?: "default" | "inverse" }) {
  const search = usePlpSearch();
  const navigate = usePlpNavigate();
  const inverse = tone === "inverse";

  return (
    <div className="relative">
      <label htmlFor="plp-sort" className="sr-only">
        Sort products
      </label>
      <select
        id="plp-sort"
        value={search.sort ?? DEFAULT_SORT}
        onChange={(event) => navigate(withValue(search, "sort", event.target.value as ProductSort))}
        className={`min-h-11 appearance-none border bg-transparent pl-3 pr-9 text-sm ${
          inverse ? "border-kc-paper/30 text-kc-paper" : "border-kc-line text-kc-ink"
        }`}
      >
        {sortOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        className={`pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 ${
          inverse ? "text-kc-paper/70" : "text-kc-muted"
        }`}
        aria-hidden="true"
      />
    </div>
  );
}
