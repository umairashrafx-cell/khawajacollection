/**
 * /ready-to-wear — see docs/BUILD-SPEC.pdf Section 11.2.
 * All the behaviour lives in CatalogPage and src/lib/catalog-page.ts; this file
 * is the route's identity and nothing else.
 */

import { createFileRoute } from "@tanstack/react-router";

import { CatalogSkeleton } from "@/components/skeletons/Skeletons";
import { CatalogPage } from "@/components/catalog/CatalogPage";
import { readyToWearCatalog as descriptor } from "@/config/catalog-routes";
import { catalogHead, loadCatalog } from "@/lib/catalog-page";
import { validatePlpSearch } from "@/lib/plp-search";

export const Route = createFileRoute("/ready-to-wear")({
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
