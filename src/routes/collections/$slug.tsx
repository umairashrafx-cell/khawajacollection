/**
 * /collections/$slug — see docs/BUILD-SPEC.pdf Sections 7 and 11.2.
 */

import { createFileRoute } from "@tanstack/react-router";

import { CatalogPage } from "@/components/catalog/CatalogPage";
import { catalogHead, loadCollectionListing } from "@/lib/catalog-page";
import { validatePlpSearch } from "@/lib/plp-search";

export const Route = createFileRoute("/collections/$slug")({
  validateSearch: validatePlpSearch,
  loaderDeps: ({ search }) => search,
  loader: ({ params, deps }) => loadCollectionListing(params.slug, deps),
  head: ({ match, loaderData }) =>
    loaderData
      ? catalogHead(loaderData.descriptor, match.search, loaderData.data)
      : { meta: [{ title: "Not found | Khawaja Collection" }] },
  component: Page,
});

function Page() {
  const { descriptor, data } = Route.useLoaderData();
  return <CatalogPage descriptor={descriptor} data={data} />;
}
