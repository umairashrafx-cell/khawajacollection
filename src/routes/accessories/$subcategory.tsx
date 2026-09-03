/**
 * /accessories/$subcategory — see docs/BUILD-SPEC.pdf Sections 7 and 11.2.
 * The descriptor depends on the URL, so the loader builds it and the component
 * reads it back rather than importing a constant.
 */

import { createFileRoute } from "@tanstack/react-router";

import { CatalogPage } from "@/components/catalog/CatalogPage";
import { catalogHead, loadSubcategory } from "@/lib/catalog-page";
import { validatePlpSearch } from "@/lib/plp-search";

const parent = { slug: "accessories", label: "Accessories", href: "/accessories" };

export const Route = createFileRoute("/accessories/$subcategory")({
  validateSearch: validatePlpSearch,
  loaderDeps: ({ search }) => search,
  loader: ({ params, deps }) => loadSubcategory(parent, params.subcategory, deps),
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
