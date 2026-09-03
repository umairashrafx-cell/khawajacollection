/**
 * Route-agnostic access to the PLP search params.
 *
 * Nine listing routes share one filter UI, so the filter components must not be
 * bound to any single route's generated types. Reading from router state and
 * navigating without a `to` keeps them portable: `navigate({ search })` stays
 * on whichever listing route is currently rendered.
 */

import { useCallback } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";

import type { PlpSearch } from "@/lib/plp-search";

export function usePlpSearch(): PlpSearch {
  return useRouterState({
    select: (state) => state.location.search as PlpSearch,
  });
}

export function usePlpNavigate(): (next: PlpSearch) => void {
  const navigate = useNavigate() as unknown as (options: {
    search: PlpSearch;
    replace?: boolean;
    resetScroll?: boolean;
  }) => void;

  return useCallback(
    (next: PlpSearch) => {
      // Toggling a filter is not a new destination, so it should not add a
      // history entry per checkbox — the back button steps out of the filtered
      // view, not through every checkbox on the way in.
      navigate({ search: next, replace: true, resetScroll: false });
    },
    [navigate],
  );
}

/** Paging is a real destination, so it gets its own history entry and scrolls. */
export function usePageNavigate(): (next: PlpSearch) => void {
  const navigate = useNavigate() as unknown as (options: {
    search: PlpSearch;
    replace?: boolean;
    resetScroll?: boolean;
  }) => void;

  return useCallback(
    (next: PlpSearch) => {
      navigate({ search: next });
    },
    [navigate],
  );
}
