/**
 * Shared plumbing for every product listing page.
 * See docs/BUILD-SPEC.pdf Sections 11.2 and 13.
 *
 * Nine routes (/women, /men, /unstitched, …) differ only in their title, copy
 * and fixed query, so each route file is a descriptor plus three lines that
 * hand off to these helpers. That is what keeps facet counts, canonical rules,
 * pagination and JSON-LD identical across all of them.
 */

import { notFound, redirect } from "@tanstack/react-router";

import { PER_PAGE } from "@/config/filters";
import { PLACEHOLDER, site } from "@/config/site";
import {
  buildSearchString,
  hasActiveFilters,
  toProductQuery,
  type PlpSearch,
} from "@/lib/plp-search";
import {
  categoryRepository,
  collectionRepository,
  productRepository,
  type ProductQuery,
} from "@/lib/repositories";
import type { Facets, Product } from "@/types";

export interface Crumb {
  label: string;
  href: string;
}

export interface CatalogDescriptor {
  /** Canonical path with no query, e.g. "/women". */
  path: string;
  /** The single h1 on the page. */
  h1: string;
  /** Under 60 characters (Section 13). */
  metaTitle: string;
  /** 150–160 characters, doubles as the one-line description under the h1. */
  description: string;
  /** The part of the query the route owns and the URL cannot override. */
  base: ProductQuery;
  /** Ancestors only — Home is prepended and the current page appended. */
  ancestors?: Crumb[];
  /** `/sale` is visually distinct (Section 11.1 item 9). */
  tone?: "default" | "inverse";
}

export interface CatalogData {
  items: Product[];
  total: number;
  facets: Facets;
  page: number;
  perPage: number;
  totalPages: number;
}

export async function loadCatalog(
  descriptor: CatalogDescriptor,
  search: PlpSearch,
): Promise<CatalogData> {
  const query = toProductQuery(search, descriptor.base);
  const { items, total, facets } = await productRepository.list(query);
  const perPage = query.perPage ?? PER_PAGE;
  const page = query.page ?? 1;
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  // A page beyond the end of the result set is not a page — it renders empty
  // and reports a nonsense range. Narrowing the filters on page 3 is the usual
  // way to land here. Redirect to the last real page rather than serve it, so
  // the URL stays honest and no two URLs show the same grid. Temporary, not
  // 301: which page is last depends on stock.
  if (page > totalPages) {
    const { page: _dropped, ...withoutPage } = search;
    const clamped: PlpSearch = totalPages > 1 ? { ...withoutPage, page: totalPages } : withoutPage;
    throw redirect({
      href: `${descriptor.path}${buildSearchString(clamped)}`,
      replace: true,
    });
  }

  return {
    items,
    total,
    facets,
    page,
    perPage,
    totalPages,
  };
}

/** Absolute when the production domain is known, path-relative until then. */
export function absoluteUrl(path: string): string {
  // An absolute URL is returned untouched — see the long note on the twin of
  // this function in src/lib/seo.ts, which had the same bug.
  if (/^https?:\/\//i.test(path)) return path;
  return site.url === PLACEHOLDER ? path : `${String(site.url).replace(/\/$/, "")}${path}`;
}

function pagedPath(path: string, page: number): string {
  return page > 1 ? `${path}?page=${page}` : path;
}

export function crumbsFor(descriptor: CatalogDescriptor): Crumb[] {
  return [
    { label: "Home", href: "/" },
    ...(descriptor.ancestors ?? []),
    { label: descriptor.h1, href: descriptor.path },
  ];
}

/**
 * Route `head()`. Section 13:
 *   - a filtered view canonicalises to the unfiltered category URL, so the
 *     facet permutations do not compete with each other
 *   - a paginated view is self-canonical and carries rel prev/next
 */
export function catalogHead(
  descriptor: CatalogDescriptor,
  search: PlpSearch,
  data: CatalogData | undefined,
) {
  const filtered = hasActiveFilters(search);
  const page = data?.page ?? 1;
  const totalPages = data?.totalPages ?? 1;

  const canonicalPath = filtered ? descriptor.path : pagedPath(descriptor.path, page);
  const title = page > 1 ? `${descriptor.metaTitle} — Page ${page}` : descriptor.metaTitle;

  const links: { rel: string; href: string }[] = [
    { rel: "canonical", href: absoluteUrl(canonicalPath) },
  ];
  if (!filtered && page > 1) {
    links.push({ rel: "prev", href: absoluteUrl(pagedPath(descriptor.path, page - 1)) });
  }
  if (!filtered && page < totalPages) {
    links.push({ rel: "next", href: absoluteUrl(pagedPath(descriptor.path, page + 1)) });
  }

  const crumbs = crumbsFor(descriptor);

  return {
    meta: [
      { title },
      { name: "description", content: descriptor.description },
      // en_PK on all three head builders. THERE ARE THREE, which is the real
      // finding here — seoHead, catalogHead and the PDP each assemble their own
      // meta, so a tag added to one silently misses two thirds of the site.
      // Worth collapsing into seoHead the next time this file is opened.
      { property: "og:locale", content: "en_PK" },
      { property: "og:title", content: title },
      { property: "og:description", content: descriptor.description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: absoluteUrl(descriptor.path) },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links,
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: crumbs.map((crumb, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: crumb.label,
            item: absoluteUrl(crumb.href),
          })),
        }),
      },
      // ItemList on category pages (Section 13). Only the current page of
      // results, because that is what this URL actually shows.
      ...(data && data.items.length > 0
        ? [
            {
              type: "application/ld+json",
              children: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "ItemList",
                name: descriptor.h1,
                numberOfItems: data.total,
                itemListElement: data.items.map((product, index) => ({
                  "@type": "ListItem",
                  position: (page - 1) * data.perPage + index + 1,
                  url: absoluteUrl(`/products/${product.slug}`),
                  name: product.name,
                })),
              }),
            },
          ]
        : []),
    ],
  };
}

/* ------------------------------------------------------------------ */
/* Dynamic listings — their descriptor depends on the URL              */
/* ------------------------------------------------------------------ */

/**
 * `/women/unstitched` and friends. Category slugs are globally unique
 * (Section 8.3 makes slug the primary key), so the stored slug is
 * `${parentSlug}-${segment}` and the URL carries only the segment.
 */
/**
 * How a department's name joins its subcategory's in a heading.
 *
 * "possessive" is the default and reads correctly for the departments that
 * name PEOPLE: Women + Unstitched gives "Unstitched for Women" and "Women's
 * Unstitched". Applied to a department that names a THING it produces
 * nonsense — Bedsheets + King gave "King for Bedsheets" and, worse,
 * "Bedsheets's King" in the title tag, which is not even correct English for
 * a plural. "plain" drops the possessive entirely and lets the breadcrumb
 * carry the parent, which is the one form that works for every child:
 * "Quilt Covers Bedsheets" would be no better than what it replaced.
 */
export type SubcategoryNaming = "possessive" | "plain";

export interface SubcategoryParent extends Crumb {
  slug: string;
  naming?: SubcategoryNaming;
}

export async function loadSubcategory(
  parent: SubcategoryParent,
  segment: string,
  search: PlpSearch,
): Promise<{ descriptor: CatalogDescriptor; data: CatalogData }> {
  const category = await categoryRepository.getSubcategory(parent.slug, segment);
  if (!category) throw notFound();

  const plain = parent.naming === "plain";

  const descriptor: CatalogDescriptor = {
    path: `${parent.href}/${segment}`,
    h1: plain ? category.name : `${category.name} for ${parent.label}`,
    metaTitle: plain
      ? `${category.name} — ${parent.label} | Khawaja Collection`
      : `${parent.label}'s ${category.name} | Khawaja Collection`,
    description:
      category.description ??
      `${category.name} from Khawaja Collection, made in limited runs in Lahore.`,
    base: { category: parent.slug, subcategory: category.slug },
    ancestors: [{ label: parent.label, href: parent.href }],
  };

  return { descriptor, data: await loadCatalog(descriptor, search) };
}

/** `/collections/$slug`. */
export async function loadCollectionListing(
  slug: string,
  search: PlpSearch,
): Promise<{ descriptor: CatalogDescriptor; data: CatalogData }> {
  const collection = await collectionRepository.getBySlug(slug);
  if (!collection) throw notFound();

  const descriptor: CatalogDescriptor = {
    path: `/collections/${collection.slug}`,
    h1: collection.name,
    metaTitle: `${collection.name} | Khawaja Collection`,
    // metaDescription first: the tagline is display copy and runs about a
    // third of the width a search result gives you.
    description:
      collection.metaDescription ??
      collection.tagline ??
      `The ${collection.name} collection from Khawaja Collection, made in limited runs in Lahore.`,
    base: { collection: collection.slug },
    ancestors: [{ label: "Collections", href: "/new-arrivals" }],
  };

  return { descriptor, data: await loadCatalog(descriptor, search) };
}
