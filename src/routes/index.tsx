/**
 * Homepage. See docs/BUILD-SPEC.pdf Section 11.1 — the twelve sections in the
 * order given there. The announcement bar (1) and footer (12) live in the root
 * layout; this route renders 2 through 11.
 *
 * All data is read in the loader, on the server, through the repository seam.
 * No component here touches src/data (Hard Rules 1 and 3).
 */

import { createFileRoute } from "@tanstack/react-router";

import { AppLink } from "@/components/layout/AppLink";
import { Container, Section } from "@/components/layout/Container";
import { EditorialBanner, EditorialSplit } from "@/components/home/EditorialBanner";
import { HeroSection } from "@/components/home/HeroSection";
import { NewsletterSection } from "@/components/home/NewsletterSection";
import { SectionHeader } from "@/components/home/SectionHeader";
import { ShopByCategory } from "@/components/home/ShopByCategory";
import { SocialGrid } from "@/components/home/SocialGrid";
import { ProductCarousel } from "@/components/product/ProductCarousel";
import { ProductGrid } from "@/components/product/ProductGrid";
import { edits, featuredCollection, hero, sale, socialSection } from "@/config/home";
import { site } from "@/config/site";
import { productRepository } from "@/lib/repositories";

const title = "Khawaja Collection — Premium Pakistani Fashion";
const description =
  "Hand-finished lawn, silk and velvet for women and men, cut in limited runs in Lahore. Cash on delivery across Pakistan.";

export const Route = createFileRoute("/")({
  loader: async () => {
    const [newArrivals, trending, womenEdit, menEdit, saleItems] = await Promise.all([
      productRepository.list({ isNewArrival: true, sort: "newest", perPage: 8 }),
      productRepository.list({ isBestSeller: true, sort: "best-selling", perPage: 8 }),
      productRepository.list({ category: "women", sort: "featured", perPage: 4 }),
      productRepository.list({ category: "men", sort: "featured", perPage: 4 }),
      productRepository.list({ onSale: true, sort: "featured", perPage: 6 }),
    ]);

    return {
      newArrivals: newArrivals.items,
      trending: trending.items,
      womenEdit: womenEdit.items,
      menEdit: menEdit.items,
      sale: saleItems.items,
    };
  },

  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/" },
      { property: "og:image", content: "/placeholders/og-16x9.svg" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "canonical", href: "/" },
      // The hero is the LCP element, so the browser learns about it from the
      // document head rather than after the CSS resolves (Section 14).
      // React 19 wants the camelCase prop here; the lowercase HTML attribute
      // name is rejected as an invalid DOM property and the hint is dropped.
      { rel: "preload", as: "image", href: hero.image.src, fetchPriority: "high" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Store",
          name: site.name,
          description,
          // No address, phone or opening hours: those are PLACEHOLDER in
          // src/config/site.ts and Guardrail 2 forbids inventing them.
          currenciesAccepted: "PKR",
          paymentAccepted: "Cash on Delivery",
          areaServed: "PK",
        }),
      },
    ],
  }),

  component: HomePage,
});

function HomePage() {
  const { newArrivals, trending, womenEdit, menEdit, sale: saleItems } = Route.useLoaderData();
  const [womenEditContent, menEditContent] = edits;

  return (
    <>
      {/* 2 — Hero */}
      <HeroSection />

      {/* 3 — Shop by Category */}
      <Container>
        <Section>
          <SectionHeader eyebrow="Browse" title="Shop by category" />
          <ShopByCategory />
        </Section>
      </Container>

      {/* 4 — New Arrivals */}
      <Container>
        <Section className="pt-0">
          <SectionHeader
            eyebrow="Just in"
            title="New arrivals"
            action={{ label: "View all", href: "/new-arrivals" }}
          />
          <ProductCarousel products={newArrivals} label="New arrivals" />
        </Section>
      </Container>

      {/* 5 — Featured collection */}
      <EditorialSplit content={featuredCollection} />

      {/* 6 — Trending Now */}
      <Container>
        <Section>
          <SectionHeader
            eyebrow="Most loved"
            title="Trending now"
            action={{ label: "View all", href: "/new-arrivals" }}
          />
          <ProductGrid products={trending} />
        </Section>
      </Container>

      {/* 7 — Women's edit */}
      {womenEditContent ? (
        <Container>
          <Section className="pt-0">
            <EditorialBanner content={womenEditContent} />
            <div className="mt-8">
              <ProductGrid products={womenEdit} columns={{ mobile: 2, tablet: 2, desktop: 4 }} />
            </div>
            <div className="mt-8">
              <EditCta cta={womenEditContent.cta} />
            </div>
          </Section>
        </Container>
      ) : null}

      {/* 8 — Men's edit */}
      {menEditContent ? (
        <Container>
          <Section className="pt-0">
            <EditorialBanner content={menEditContent} />
            <div className="mt-8">
              <ProductGrid products={menEdit} columns={{ mobile: 2, tablet: 2, desktop: 4 }} />
            </div>
            <div className="mt-8">
              <EditCta cta={menEditContent.cta} />
            </div>
          </Section>
        </Container>
      ) : null}

      {/* 9 — Sale, visually distinct on ink */}
      <section className="bg-kc-ink">
        <Container>
          <Section>
            <SectionHeader
              eyebrow={sale.eyebrow}
              title={sale.headline}
              description={sale.body}
              action={{ label: sale.cta.label, href: sale.cta.href }}
              tone="inverse"
            />
            <ProductGrid
              products={saleItems}
              columns={{ mobile: 2, tablet: 3, desktop: 3 }}
              tone="inverse"
            />
          </Section>
        </Container>
      </section>

      {/* 10 — Follow Khawaja Collection */}
      <Container>
        <Section>
          <SectionHeader
            eyebrow={socialSection.eyebrow}
            title={socialSection.headline}
            description={socialSection.body}
          />
          <SocialGrid />
        </Section>
      </Container>

      {/* 11 — Newsletter */}
      <NewsletterSection />
    </>
  );
}

function EditCta({ cta }: { cta: { label: string; href: string } }) {
  return (
    <AppLink
      href={cta.href}
      className="inline-block border border-kc-ink px-8 py-3.5 text-[12px] font-medium uppercase tracking-[0.08em] text-kc-ink transition-colors hover:bg-kc-ink hover:text-kc-paper"
    >
      {cta.label}
    </AppLink>
  );
}
