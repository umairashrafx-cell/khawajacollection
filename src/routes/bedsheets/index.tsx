/**
 * /bedsheets — the home textiles listing.
 *
 * Structurally identical to /women and /men: a descriptor and nothing else.
 * That is the point of `CatalogPage` — adding a whole department costs two
 * route files and a descriptor, not a new page implementation.
 */

import { createFileRoute } from "@tanstack/react-router";

import { CatalogSkeleton } from "@/components/skeletons/Skeletons";
import { CatalogPage } from "@/components/catalog/CatalogPage";
import { bedsheetsCatalog as descriptor } from "@/config/catalog-routes";
import { catalogHead, loadCatalog } from "@/lib/catalog-page";
import { validatePlpSearch } from "@/lib/plp-search";

export const Route = createFileRoute("/bedsheets/")({
  validateSearch: validatePlpSearch,
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => loadCatalog(descriptor, deps),
  head: ({ match, loaderData }) => catalogHead(descriptor, match.search, loaderData),
  pendingComponent: CatalogSkeleton,
  component: Page,
});

function Page() {
  return <CatalogPage descriptor={descriptor} data={Route.useLoaderData()} />;
}
