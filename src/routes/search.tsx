/**
 * Search results. See docs/BUILD-SPEC.pdf Section 11.6:
 * "/search?q= for a full PLP-style result page with the same filters."
 *
 * It is literally the PLP. The descriptor is built per request from `q`, and
 * everything else — facets, chips, sorting, pagination, the empty state —
 * comes from CatalogPage unchanged.
 *
 * NOINDEX, added deliberately. Section 13 does not list /search in robots, but
 * it does rule that filtered listings must canonicalise away so permutations
 * cannot compete with each other. A query string is an unbounded set of those,
 * so a search result page is marked noindex while the bare /search stays
 * crawlable.
 */

import { createFileRoute } from "@tanstack/react-router";

import { CatalogPage } from "@/components/catalog/CatalogPage";
import { catalogHead, loadCatalog, type CatalogDescriptor } from "@/lib/catalog-page";
import { validatePlpSearch, type PlpSearch } from "@/lib/plp-search";

function descriptorFor(search: PlpSearch): CatalogDescriptor {
  const term = search.q?.trim();

  return {
    path: "/search",
    h1: term ? `Results for “${term}”` : "Search",
    metaTitle: term ? `${term} | Khawaja Collection` : "Search | Khawaja Collection",
    description: term
      ? `Pieces from the Khawaja Collection catalogue matching “${term}”. Filter by size, colour, fabric and price.`
      : "Search the Khawaja Collection catalogue by name, category, fabric or colour.",
    base: {},
  };
}

export const Route = createFileRoute("/search")({
  validateSearch: validatePlpSearch,
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => loadCatalog(descriptorFor(deps), deps),
  head: ({ match, loaderData }) => {
    const head = catalogHead(descriptorFor(match.search), match.search, loaderData);
    return {
      ...head,
      meta: [...head.meta, { name: "robots", content: "noindex, follow" }],
    };
  },
  component: SearchPage,
});

function SearchPage() {
  const search = Route.useSearch();
  return <CatalogPage descriptor={descriptorFor(search)} data={Route.useLoaderData()} />;
}
