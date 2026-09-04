/**
 * /bedsheets/$subcategory — Single, Double, King, Quilt Covers.
 *
 * Same shape as /women/$subcategory: the descriptor depends on the URL, so the
 * loader builds it and the component reads it back. A subcategory added in the
 * admin appears here with no code change, because this route resolves the
 * segment against the category repository rather than a list in a file.
 */

import { createFileRoute } from "@tanstack/react-router";

import { CatalogSkeleton } from "@/components/skeletons/Skeletons";
import { CatalogPage } from "@/components/catalog/CatalogPage";
import { catalogHead, loadSubcategory } from "@/lib/catalog-page";
import { validatePlpSearch } from "@/lib/plp-search";

/*
 * "plain" rather than the default possessive. Women + Unstitched reads
 * "Women's Unstitched"; Bedsheets + King read "Bedsheets's King", which is
 * both wrong and visibly generated. See SubcategoryNaming.
 */
const parent = {
  slug: "bedsheets",
  label: "Bedsheets",
  href: "/bedsheets",
  naming: "plain",
} as const;

export const Route = createFileRoute("/bedsheets/$subcategory")({
  validateSearch: validatePlpSearch,
  loaderDeps: ({ search }) => search,
  loader: ({ params, deps }) => loadSubcategory(parent, params.subcategory, deps),
  head: ({ match, loaderData }) =>
    loaderData
      ? catalogHead(loaderData.descriptor, match.search, loaderData.data)
      : { meta: [{ title: "Not found | Khawaja Collection" }] },
  pendingComponent: CatalogSkeleton,
  component: Page,
});

function Page() {
  const { descriptor, data } = Route.useLoaderData();
  return <CatalogPage descriptor={descriptor} data={data} />;
}
