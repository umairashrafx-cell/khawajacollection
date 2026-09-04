/**
 * Terms of Service. docs/BUILD-SPEC.pdf Phase 9 item 4.
 *
 * Written around what the software genuinely does — server-side pricing,
 * stock checked at order time, orders confirmed rather than accepted on
 * submission — because those are the terms that actually bind and they are
 * verifiable in this repository.
 *
 * The legal identity, the governing jurisdiction and the effective date are
 * visible placeholders. A terms page that names the wrong company or the wrong
 * courts is worse than no terms page, and Hard Rule 9 forbids guessing either.
 * Legal review is on the launch checklist.
 */

import { createFileRoute } from "@tanstack/react-router";

import { Bullets, ContentPage, Inline, Section, TBC } from "@/components/content/ContentPage";
import { pageDescription, pageTitle, seoHead } from "@/lib/seo";

const DESCRIPTION = pageDescription(
  "The terms you agree to when ordering from Khawaja Collection: pricing, stock, order confirmation, and what happens when something goes wrong.",
);

export const Route = createFileRoute("/terms")({
  head: () =>
    seoHead({
      title: pageTitle("Terms of Service"),
      description: DESCRIPTION,
      path: "/terms",
    }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <ContentPage
      title="Terms of service"
      intro="The terms that apply when you order from us."
      updated={<TBC what="effective date" />}
    >
      <Section heading="Who you are dealing with">
        <p>
          This site is operated by <TBC what="registered business name" />, registered at{" "}
          <TBC what="registered address" />. Referring to "we" or "us" below means that business.
        </p>
      </Section>

      <Section heading="Prices">
        <p>
          All prices are in Pakistani Rupees and include no hidden additions. The price that applies
          to your order is the one our server calculates when you place it, from our own records —
          not the figure your browser last saw. This protects you from a stale page and protects us
          from a tampered one, and it means the total shown on your confirmation is authoritative.
        </p>
        <p>We may change prices at any time. A change never affects an order already confirmed.</p>
      </Section>

      <Section heading="Stock and confirmation">
        <p>
          Placing an order is an offer to buy, not a completed sale. We check stock at the moment
          you order and again when we confirm. Because pieces are cut in limited runs, the last one
          can go between your order and our confirmation.
        </p>
        <p>
          If that happens we will tell you and cancel the order. Where you have already paid, the{" "}
          <Inline href="/refund-policy">refund policy</Inline> applies. With cash on delivery there
          is nothing to return, since nothing was taken.
        </p>
      </Section>

      <Section heading="Delivery">
        <p>
          Delivery timings on the <Inline href="/shipping">shipping page</Inline> are estimates
          based on how couriers normally perform. They are not guarantees. We stay responsible for a
          parcel until it reaches you, and we will chase a late one rather than tell you to contact
          the courier yourself.
        </p>
      </Section>

      <Section heading="Made-to-order pieces">
        <p>
          Some bridal and formal pieces are cut to your measurements. Before work begins we confirm
          both the measurements and the timeline with you, and nothing is cut until you have agreed
          to both. Because the result fits only you, these pieces cannot be exchanged or refunded
          for a change of mind — this is stated on the product page before you commit.
        </p>
      </Section>

      <Section heading="Your account">
        <p>
          If you create an account, keep your password to yourself and tell us if you think someone
          else has it. You are responsible for orders placed from your account. Guest checkout is
          always available if you would rather not have one.
        </p>
      </Section>

      <Section heading="Using this site">
        <Bullets
          items={[
            "Our photography, copy and designs are ours. Please do not reproduce them commercially.",
            "Do not attempt to interfere with the site, its ordering system, or other people's orders.",
            "Do not place orders you do not intend to accept. Repeated refusals at the door may mean we decline future cash-on-delivery orders from you.",
          ]}
        />
      </Section>

      <Section heading="When we get it wrong">
        <p>
          If a piece arrives damaged, faulty, or is not what you ordered, we put it right at our own
          cost — see <Inline href="/returns">exchange &amp; returns</Inline>. Nothing in these terms
          removes rights you have under Pakistani consumer law.
        </p>
      </Section>

      <Section heading="Governing law">
        <p>
          These terms are governed by the laws of <TBC what="governing jurisdiction" />, and
          disputes fall to the courts of <TBC what="court jurisdiction" />.
        </p>
      </Section>

      <Section heading="Changes">
        <p>
          We may update these terms. The version that applies to your order is the one published
          when you placed it, and changes are never applied backwards.
        </p>
      </Section>
    </ContentPage>
  );
}
