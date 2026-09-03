import { createFileRoute } from "@tanstack/react-router";
import Hero from "@/components/home/Hero";
import CategoryTiles from "@/components/home/CategoryTiles";
import EditorialSplit from "@/components/home/EditorialSplit";
import Newsletter from "@/components/home/Newsletter";
import SocialStrip from "@/components/home/SocialStrip";
import SectionHeader from "@/components/home/SectionHeader";
import ProductGrid from "@/components/shop/ProductGrid";
import PageContainer from "@/components/layout/PageContainer";
import { byTag } from "@/services/catalogService";

const title = "Khawaja Collection — Premium Pakistani Fashion";
const description =
  "Shop Khawaja Collection: hand-finished lawn, silk and velvet pieces for women and men, made in limited runs in Lahore. Cash on delivery across Pakistan.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Store",
          name: "Khawaja Collection",
          description,
          address: {
            "@type": "PostalAddress",
            streetAddress: "Main Boulevard, Gulberg III",
            addressLocality: "Lahore",
            addressCountry: "PK",
          },
        }),
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const newArrivals = byTag("new", 8);
  const trending = byTag("trending", 4);
  const sale = byTag("sale", 4);

  return (
    <>
      <Hero />

      <PageContainer className="py-16 lg:py-20">
        <SectionHeader eyebrow="Browse" title="Shop by category" />
        <CategoryTiles />
      </PageContainer>

      <PageContainer className="pb-16 lg:pb-20">
        <SectionHeader eyebrow="Just in" title="New arrivals" to="/category/women" />
        <ProductGrid products={newArrivals} />
      </PageContainer>

      <PageContainer className="pb-16 lg:pb-20">
        <SectionHeader eyebrow="Most loved" title="Trending now" to="/category/women" />
        <ProductGrid products={trending} />
      </PageContainer>

      <PageContainer className="pb-16 lg:pb-20">
        <EditorialSplit />
      </PageContainer>

      <PageContainer className="pb-16 lg:pb-20">
        <SectionHeader eyebrow="End of season" title="Sale edit" to="/category/sale" />
        <ProductGrid products={sale} />
      </PageContainer>

      <PageContainer className="pb-16 lg:pb-20">
        <SectionHeader eyebrow="@khawajacollection" title="From the studio" />
        <SocialStrip />
      </PageContainer>

      <Newsletter />
    </>
  );
}
