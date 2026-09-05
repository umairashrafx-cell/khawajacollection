/**
 * Refund Policy. docs/BUILD-SPEC.pdf Phase 9 item 4.
 *
 * Every number a refund policy normally carries — the window, how many days
 * the money takes to come back — is a business commitment nobody has given me,
 * so all of them are visible placeholders. The page states the *shape* of the
 * policy, which follows from how the shop actually works: Cash on Delivery is
 * the only live payment method, which genuinely changes what a refund means.
 */

import { createFileRoute } from "@tanstack/react-router";

import { Bullets, ContentPage, Fact, Inline, Section } from "@/components/content/ContentPage";
import { commerce, legal } from "@/config/site";
import { pageDescription, pageTitle, seoHead } from "@/lib/seo";

const DESCRIPTION = pageDescription(
  "When Khawaja Collection issues a refund, how it is paid back, and what happens with cash on delivery orders.",
);

export const Route = createFileRoute("/refund-policy")({
  head: () =>
    seoHead({
      title: pageTitle("Refund Policy"),
      description: DESCRIPTION,
      path: "/refund-policy",
    }),
  component: RefundPolicyPage,
});

function RefundPolicyPage() {
  return (
    <ContentPage
      title="Refund policy"
      intro="We would rather exchange a piece than refund it, but where a refund is right, this is how it works."
      updated={<Fact value={legal.effectiveDate} what="policy date" />}
    >
      <Section heading="When we refund">
        <Bullets
          items={[
            "The piece arrived damaged, faulty, or is not what you ordered, and you would prefer money back to a replacement.",
            "We cancelled your order — for example the last piece sold out between your order and our confirmation.",
            "You cancelled before the order was dispatched.",
          ]}
        />
        <p>
          For a change of mind on a piece that arrived exactly as described, we offer an exchange
          rather than a refund. See <Inline href="/returns">exchange &amp; returns</Inline>.
        </p>
      </Section>

      <Section heading="Cash on delivery">
        <p>
          Cash on delivery is currently the only live payment method, and it changes what a refund
          means in practice. If you have not paid the courier yet, there is nothing to refund —
          refusing or returning the parcel is the whole process. A refund only arises once money has
          actually changed hands.
        </p>
      </Section>

      <Section heading="How the money comes back">
        <p>
          Where a refund is due on a paid order, we return it to you by bank transfer to an account
          in your name. We will ask for those details after the refund is approved, never before,
          and never by any channel other than the one you contacted us on.
        </p>
        <p>
          We aim to send it within{" "}
          <Fact value={legal.refundProcessingTime} what="refund processing time" /> of approving the
          request. How long it then takes to appear is your bank's business, not ours.
        </p>
      </Section>

      <Section heading="Delivery charges">
        <p>
          Where the fault is ours, any delivery charge you paid is refunded with the piece. Where it
          is not — a change of mind, a wrong size ordered — the delivery charge is not refunded,
          because the courier was paid to do the job and did it. Orders above{" "}
          {commerce.freeDeliveryThreshold.toLocaleString("en-PK")} PKR ship free, so this often does
          not arise.
        </p>
      </Section>

      <Section heading="Starting a request">
        <p>
          <Inline href="/contact">Contact us</Inline> with your order number and what went wrong. If
          it is a damaged or incorrect piece, a photograph taken in daylight will usually settle it
          in one message.
        </p>
      </Section>
    </ContentPage>
  );
}
