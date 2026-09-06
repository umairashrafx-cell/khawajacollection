/**
 * Our Story. docs/BUILD-SPEC.pdf Phase 9 item 4.
 *
 * The copy describes what the shop sells and where it is, which are things the
 * repository and Umair actually establish. It makes no claim about when KC was
 * founded, who runs it, or how many people work there, because none of that is
 * written down anywhere I can check and Hard Rule 9 forbids inventing it.
 *
 * IT USED TO CLAIM KC MANUFACTURED, and that was wrong. Every version of this
 * page until 2026-09-07 said the pieces were cut, finished by hand and
 * embroidered in a Lahore studio -- inherited from the Lovable prototype's
 * placeholder copy, never checked, and repeated across thirteen files
 * including the homepage meta description and the Store structured data. Umair
 * confirmed on 2026-09-07 that nothing is made in Lahore. KC is a clothing and
 * fabric shop; the copy now says so.
 *
 * The lesson generalises past this page: placeholder MARKETING copy is more
 * dangerous than a placeholder phone number, because a wrong number is
 * obviously wrong and an invented brand story reads perfectly.
 */

import { createFileRoute } from "@tanstack/react-router";

import { Bullets, ContentPage, Inline, Section } from "@/components/content/ContentPage";
import { contact } from "@/config/site";
import { pageDescription, pageTitle, seoHead } from "@/lib/seo";

const DESCRIPTION = pageDescription(
  "Khawaja Collection is a clothing and fabric shop in Mandi Bahauddin selling unstitched lawn, ready to wear, formals, bridal and bedding across Pakistan.",
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
      intro="Khawaja Collection is a clothing and fabric shop in Mandi Bahauddin, choosing a considered range carefully rather than stocking everything."
    >
      <Section heading="What we sell">
        <p>
          Our range runs from unstitched lawn and khaddar through ready to wear and formals to
          bridal, alongside dupattas and accessories and a range of bedsheets and quilt covers.
        </p>
        <p>
          We keep the range tight on purpose. It is easier to stand behind cloth you have chosen
          piece by piece than a catalogue nobody has looked at closely.
        </p>
      </Section>

      <Section heading="How we work">
        <Bullets
          items={[
            "Cloth first. We choose what we stock by how it handles and how it wears, not by what is cheapest to buy in.",
            "Come and see it. The shop is open six days a week and the cloth is there to be handled before you buy.",
            "Photographed honestly. What you see is the colour you get, in daylight, without retouching the fabric into something it is not.",
            "Priced in PKR, with no hidden charges added at the last step of checkout.",
          ]}
        />
      </Section>

      <Section heading="Where to find us">
        <p>
          You can find us at {contact.address.name}, {contact.address.street},{" "}
          {contact.address.city}, and reach us on {contact.whatsapp} — WhatsApp is usually the
          fastest. Opening hours and everything else are on the{" "}
          <Inline href="/contact">contact page</Inline>.
        </p>
      </Section>

      {/*
        MADE TO ORDER SURVIVED THE 2026-09-07 COPY PASS, and briefly did not.
        It went out with the manufacturing claims and was put straight back:
        `isMadeToOrder` is a per-product flag the admin sets, and Terms,
        Returns, Shipping, FAQs and the PDP all describe the same service. It
        says nothing about who stitches the piece or where, which is what was
        actually wrong with the rest of the page.
      */}
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
