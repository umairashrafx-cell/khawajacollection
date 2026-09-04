/**
 * Product detail page. See docs/BUILD-SPEC.pdf Section 11.3.
 *
 * Two columns on desktop — gallery 58%, info 42%, info sticky — and a single
 * column with a full-bleed gallery on mobile. Everything is loaded in the
 * route loader, server side, through the repository seam.
 *
 * ON THE MISSING AggregateRating. Section 11.3 and Phase 5 both ask for it,
 * and it is deliberately absent until `hasRealReviews` in src/config/site.ts
 * is true. The ratings in the catalogue are generated values, and structured
 * data is a claim made directly to a search engine — an invented one is
 * fabricated review markup. Phase 9 resolved this by gating rather than
 * deleting, so real reviews switch it back on with one boolean.
 */

import { createFileRoute, notFound } from "@tanstack/react-router";

import { ProductSkeleton } from "@/components/skeletons/Skeletons";
import { Container, Section } from "@/components/layout/Container";
import { SectionHeader } from "@/components/home/SectionHeader";
import { Breadcrumbs } from "@/components/catalog/Breadcrumbs";
import { ProductAccordions } from "@/components/product/ProductAccordions";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductGrid } from "@/components/product/ProductGrid";
import { ProductInfo } from "@/components/product/ProductInfo";
import { RecentlyViewed } from "@/components/product/RecentlyViewed";
import { hasRealReviews, site } from "@/config/site";
import { absoluteUrl, type Crumb } from "@/lib/catalog-page";
import { labelFromSlug, resolvePrice } from "@/lib/format";
import { totalStock } from "@/lib/product-variants";
import { productRepository } from "@/lib/repositories";
import type { Product } from "@/types";

export const Route = createFileRoute("/products/$slug")({
  loader: async ({ params }) => {
    const product = await productRepository.getBySlug(params.slug);
    if (!product) throw notFound();
    return { product, related: await productRepository.related(product, 8) };
  },

  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Product not found | Khawaja Collection" }] };
    return productHead(loaderData.product);
  },

  pendingComponent: ProductSkeleton,

  component: ProductPage,
});

function crumbsFor(product: Product): Crumb[] {
  const crumbs: Crumb[] = [
    { label: "Home", href: "/" },
    {
      label: labelFromSlug(product.categorySlug),
      href: `/${product.categorySlug}`,
    },
  ];

  if (product.subcategorySlug) {
    const segment = product.subcategorySlug.replace(`${product.categorySlug}-`, "");
    crumbs.push({
      label: labelFromSlug(product.subcategorySlug, product.categorySlug),
      href: `/${product.categorySlug}/${segment}`,
    });
  }

  crumbs.push({ label: product.name, href: `/products/${product.slug}` });
  return crumbs;
}

function productHead(product: Product) {
  // Section 13 — "{Product Name} | Khawaja Collection", under 60 characters.
  const title = `${product.name} | ${site.name}`;
  const path = `/products/${product.slug}`;
  const price = resolvePrice(product);
  const inStock = totalStock(product) > 0;

  const availability = product.isMadeToOrder
    ? "https://schema.org/PreOrder"
    : inStock
      ? "https://schema.org/InStock"
      : "https://schema.org/OutOfStock";

  return {
    meta: [
      { title },
      { name: "description", content: product.shortDescription },
      { property: "og:title", content: title },
      { property: "og:description", content: product.shortDescription },
      { property: "og:type", content: "product" },
      { property: "og:url", content: absoluteUrl(path) },
      ...(product.images[0]
        ? [{ property: "og:image", content: absoluteUrl(product.images[0].url) }]
        : []),
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: absoluteUrl(path) }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.name,
          description: product.shortDescription,
          sku: product.variants[0]?.sku,
          image: product.images.map((image) => absoluteUrl(image.url)),
          ...(product.fabric ? { material: product.fabric } : {}),
          brand: { "@type": "Brand", name: site.name },
          offers: {
            "@type": "Offer",
            url: absoluteUrl(path),
            price,
            priceCurrency: "PKR",
            availability,
            itemCondition: "https://schema.org/NewCondition",
          },
          // Omitted while `hasRealReviews` is false — see src/config/site.ts.
          // Emitting AggregateRating over generated ratings is fabricated
          // review markup, which is a manual action rather than a ranking risk.
          ...(hasRealReviews
            ? {
                aggregateRating: {
                  "@type": "AggregateRating",
                  ratingValue: product.rating,
                  reviewCount: product.reviewCount,
                },
              }
            : {}),
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: crumbsFor(product).map((crumb, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: crumb.label,
            item: absoluteUrl(crumb.href),
          })),
        }),
      },
    ],
  };
}

function ProductPage() {
  const { product, related } = Route.useLoaderData();

  return (
    <>
      <Container>
        <div className="pt-6 lg:pt-8">
          <Breadcrumbs crumbs={crumbsFor(product)} />
        </div>

        <div className="mt-6 gap-10 lg:mt-8 lg:flex xl:gap-16">
          {/* Section 11.3 — gallery 58%, info 42%. */}
          <div className="lg:w-[58%]">
            <ProductGallery images={product.images} name={product.name} />
          </div>
          <div className="mt-8 lg:mt-0 lg:w-[42%]">
            <div className="lg:sticky lg:top-24">
              <ProductInfo product={product} />
            </div>
          </div>
        </div>

        <div className="mt-14 max-w-3xl lg:mt-20">
          <ProductAccordions product={product} />
        </div>

        {related.length > 0 ? (
          <Section>
            <SectionHeader eyebrow="Complete the look" title="You may also like" />
            <ProductGrid products={related} columns={{ mobile: 2, tablet: 3, desktop: 4 }} />
          </Section>
        ) : null}

        <Section className="pt-0">
          <RecentlyViewed product={product} />
        </Section>
      </Container>
    </>
  );
}
