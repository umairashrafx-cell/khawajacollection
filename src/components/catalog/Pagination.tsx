/**
 * Numbered pagination. See docs/BUILD-SPEC.pdf Section 11.2.
 *
 * Numbered, not infinite scroll — better for SEO and for anyone on unreliable
 * mobile data, who can leave and come back to page 3. The matching rel
 * prev/next links are emitted by the route's head().
 */

import { ChevronLeft, ChevronRight } from "lucide-react";

import { usePageNavigate, usePlpSearch } from "@/hooks/usePlpSearch";
import { withValue } from "@/lib/plp-search";

/** Page numbers to show, with `null` standing in for an ellipsis. */
function pageWindow(current: number, total: number): (number | null)[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages = new Set<number>([1, total, current]);
  for (const offset of [-1, 1]) {
    const page = current + offset;
    if (page > 1 && page < total) pages.add(page);
  }

  const sorted = [...pages].sort((a, b) => a - b);
  const out: (number | null)[] = [];
  let previous = 0;
  for (const page of sorted) {
    if (previous && page - previous > 1) out.push(null);
    out.push(page);
    previous = page;
  }
  return out;
}

export function Pagination({ page, totalPages }: { page: number; totalPages: number }) {
  const search = usePlpSearch();
  const navigate = usePageNavigate();

  if (totalPages <= 1) return null;

  const goTo = (target: number) =>
    navigate(withValue(search, "page", target > 1 ? target : undefined));

  const base =
    "flex h-11 min-w-11 items-center justify-center border px-3 text-sm transition-colors";

  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center justify-center gap-1.5">
      <button
        type="button"
        onClick={() => goTo(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
        className={`${base} border-kc-line text-kc-ink disabled:cursor-not-allowed disabled:text-kc-muted`}
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
      </button>

      {pageWindow(page, totalPages).map((entry, index) =>
        entry === null ? (
          <span key={`gap-${index}`} className="px-1 text-kc-muted" aria-hidden="true">
            …
          </span>
        ) : (
          <button
            key={entry}
            type="button"
            onClick={() => goTo(entry)}
            aria-label={`Page ${entry}`}
            aria-current={entry === page ? "page" : undefined}
            className={`${base} ${
              entry === page
                ? "border-kc-ink bg-kc-ink text-kc-paper"
                : "border-kc-line text-kc-ink hover:border-kc-ink"
            }`}
          >
            {entry}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => goTo(page + 1)}
        disabled={page >= totalPages}
        aria-label="Next page"
        className={`${base} border-kc-line text-kc-ink disabled:cursor-not-allowed disabled:text-kc-muted`}
      >
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </button>
    </nav>
  );
}
