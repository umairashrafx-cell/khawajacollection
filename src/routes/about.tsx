/**
 * Our Story. docs/BUILD-SPEC.pdf Phase 9 item 4.
 *
 * The copy describes how the shop is built and what it sells, which are things
 * the repository and the spec actually establish. It makes no claim about when
 * KC was founded, who runs it, how many people work there, or where the studio
 * is, because none of that is written down anywhere I can check and Hard Rule 9
 * forbids inventing it.
 */

import { createFileRoute } from "@tanstack/react-router";

import { Bullets, ContentPage, Inline, Section, TBC } from "@/components/content/ContentPage";
import { pageDescription, pageTitle, seoHead } from "@/lib/seo";

const DESCRIPTION = pageDescription(
  "Khawaja Collection makes premium Pakistani clothing in limited runs — unstitched lawn, ready to wear, formals and bridal, cut and finished in Lahore.",
);

export const Route = createFileRoute("/about")({
  head: () =>
    seoHead({
      title: pageTitle("Our Story"),
      description: DESCRIPTION,
      path: "/about",
    }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <ContentPage
      title="Our story"
      intro="Khawaja Collection is a Pakistani clothing house making a small number of pieces properly, rather than a large number quickly."
    >
      <Section heading="What we make">
        <p>
          Our range runs from unstitched lawn and khaddar through ready to wear and formals to
          bridal. Each piece is cut in a limited run — when a colourway sells through, it is usually
          gone rather than restocked, because the fabric was bought for that run and not the next
          one.
        </p>
        <p>
          That is a deliberate constraint. It keeps the embroidery worth looking at closely and it
          means the piece you receive is not the one everyone else is wearing.
        </p>
      </Section>

      <Section heading="How we work">
        <Bullets
          items={[
            "Fabric first. The cloth decides what a piece can be, so we choose it before the design is fixed.",
            "Finished by hand where it matters — hems, edges, and every piece of embroidery.",
            "Photographed honestly. What you see is the colour you get, in daylight, without retouching the fabric into something it is not.",
            "Priced in PKR, with no hidden charges added at the last step of checkout.",
          ]}
        />
      </Section>

      <Section heading="Where to find us">
        <p>
          Our studio is at <TBC what="studio address" /> and you can reach us on{" "}
          <TBC what="phone number" />. Full details, including opening hours, are on the{" "}
          <Inline href="/contact">contact page</Inline>.
        </p>
      </Section>

      <Section heading="Made to order">
        <p>
          Some bridal and formal pieces are made to order. For those we confirm measurements and a
          timeline with you before any cutting starts, and we will not begin until you have agreed
          to both. You can see which pieces these are on the product page — they are labelled, and
          they cannot be added to the bag without a conversation first.
        </p>
      </Section>
    </ContentPage>
  );
}
