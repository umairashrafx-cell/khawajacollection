/**
 * Mobile and tablet filter presentation. See docs/BUILD-SPEC.pdf Sections 10.2
 * and 11.2.
 *
 * A modal sheet holding the same FilterPanel the desktop sidebar renders, plus
 * the sticky bottom bar that opens it. Filters apply as they are tapped, so the
 * footer button is a live result count and a way out, not an Apply step.
 */

import { useCallback } from "react";
import { SlidersHorizontal, X } from "lucide-react";

import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { usePlpNavigate, usePlpSearch } from "@/hooks/usePlpSearch";
import { clearedSearch, hasActiveFilters } from "@/lib/plp-search";
import { closeOverlay, openOverlay, useIsOverlayOpen } from "@/store/ui-store";
import type { Facets } from "@/types";
import { FilterPanel } from "./FilterPanel";
import { SortDropdown } from "./SortDropdown";

export function FilterDrawer({
  facets,
  total,
  lockedGroups,
}: {
  facets: Facets;
  total: number;
  lockedGroups?: ("subcategory" | "collection")[];
}) {
  const open = useIsOverlayOpen("filters");
  const search = usePlpSearch();
  const navigate = usePlpNavigate();
  const close = useCallback(() => closeOverlay(), []);
  const panelRef = useFocusTrap<HTMLDivElement>(open, close);
  useBodyScrollLock(open);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        type="button"
        aria-label="Close filters"
        onClick={close}
        className="absolute inset-0 bg-kc-ink/40"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Filter products"
        tabIndex={-1}
        className="absolute inset-y-0 right-0 flex w-[92%] max-w-md flex-col bg-kc-paper"
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-kc-line px-5">
          <h2 className="font-display text-lg">Filter</h2>
          <button
            type="button"
            onClick={close}
            aria-label="Close filters"
            className="-mr-2 flex h-11 w-11 items-center justify-center"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          <FilterPanel facets={facets} {...(lockedGroups ? { lockedGroups } : {})} />
        </div>

        <div className="shrink-0 space-y-2 border-t border-kc-line px-5 py-4">
          {hasActiveFilters(search) ? (
            <button
              type="button"
              onClick={() => navigate(clearedSearch(search))}
              className="min-h-11 w-full border border-kc-line text-[12px] font-medium uppercase tracking-[0.08em] text-kc-ink"
            >
              Clear all
            </button>
          ) : null}
          <button
            type="button"
            onClick={close}
            className="min-h-12 w-full bg-kc-ink text-[12px] font-medium uppercase tracking-[0.08em] text-kc-paper"
          >
            Show {total} {total === 1 ? "result" : "results"}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Section 11.2 — mobile gets a sticky bottom bar with Filter and Sort. */
export function MobileFilterBar({ activeCount }: { activeCount: number }) {
  return (
    <div
      className="sticky bottom-0 z-30 border-t border-kc-line bg-kc-paper/95 px-4 py-2.5 backdrop-blur lg:hidden"
      style={{ boxShadow: "var(--shadow-kc)" }}
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => openOverlay("filters")}
          className="flex min-h-11 flex-1 items-center justify-center gap-2 border border-kc-ink text-[12px] font-medium uppercase tracking-[0.08em] text-kc-ink"
        >
          <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          Filter
          {activeCount > 0 ? (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-kc-ink px-1 text-[10px] text-kc-paper">
              {activeCount}
            </span>
          ) : null}
        </button>
        <div className="flex-1">
          <SortDropdown />
        </div>
      </div>
    </div>
  );
}
