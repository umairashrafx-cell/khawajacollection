/**
 * Homepage. See docs/BUILD-SPEC.pdf Section 11.1 — the twelve sections in the
 * order given there. The announcement bar (1) and footer (12) live in the root
 * layout; this route renders 2 through 11.
 *
 * All data is read in the loader, on the server, through the repository seam.
 * No component here touches src/data (Hard Rules 1 and 3).
 */

import { createFileRoute } from "@tanstack/react-router";

import { PageSkeleton } from "@/components/skeletons/Skeletons";
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
import { seoHead } from "@/lib/seo";
import { categoryRepository, productRepository } from "@/lib/repositories";

const title = "Khawaja Collection — Premium Pakistani Fashion";
const description =
  "Hand-finished lawn, silk and velvet for women and men, cut in limited runs in Lahore. Cash on delivery across Pakistan.";

export const Route = createFileRoute("/")({
  loader: async () => {
    const [newArrivals, trending, womenEdit, menEdit, saleItems, categories] = await Promise.all([
      productRepository.list({ isNewArrival: true, sort: "newest", perPage: 8 }),
      productRepository.list({ isBestSeller: true, sort: "best-selling", perPage: 8 }),
      productRepository.list({ category: "women", sort: "featured", perPage: 4 }),
      productRepository.list({ category: "men", sort: "featured", perPage: 4 }),
      productRepository.list({ onSale: true, sort: "featured", perPage: 6 }),
      // For the Shop by Category cards. Cheap — fifteen rows, and cached for a
      // minute by the repository — and it is what lets those tiles be changed
      // from the admin instead of by a deploy.
      categoryRepository.list(),
    ]);

    return {
      newArrivals: newArrivals.items,
      trending: trending.items,
      womenEdit: womenEdit.items,
      menEdit: menEdit.items,
      sale: saleItems.items,
      /*
       * Only what the tiles need. The whole Category object would put every
       * description and sort order into the HTML for no reason.
       */
      categoryCards: Object.fromEntries(
        categories
          .filter((category) => category.image?.url)
          .map((category) => [category.slug, category.image?.url as string]),
      ),
    };
  },

  // Built from seoHead like every other route. It used to hand-write its own
  // meta, and drifted: a relative canonical and og:url (Lighthouse scored SEO
  // 92 and reported "no valid rel=canonical"), and an og:image pointing at an
  // SVG placeholder, which Facebook and X both drop silently — the markup
  // looks right and the card comes out blank.
  head: () => ({
    ...seoHead({ title, description, path: "/" }),
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

  pendingComponent: PageSkeleton,

  component: HomePage,
});

function HomePage() {
  const {
    newArrivals,
    trending,
    womenEdit,
    menEdit,
    sale: saleItems,
    categoryCards,
  } = Route.useLoaderData();
  const [womenEditContent, menEditContent] = edits;

  return (
    <>
      {/* 2 — Hero */}
      <HeroSection />

      {/* 3 — Shop by Category */}
      <Container>
        <Section>
          <SectionHeader eyebrow="Browse" title="Shop by category" />
          <ShopByCategory cards={categoryCards} />
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
