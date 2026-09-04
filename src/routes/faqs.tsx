/**
 * FAQs. docs/BUILD-SPEC.pdf Phase 9 item 4.
 *
 * FAQPage JSON-LD is deliberately NOT emitted here. Google restricted rich
 * results for FAQ markup to authoritative government and health sites, so on a
 * shop it earns nothing — and an answer containing a visible "Placeholder:
 * delivery timeframe" marker would be fed to a crawler as though it were a
 * real answer. When the placeholders are filled, adding the markup is a small
 * change; shipping it now would only publish the gaps.
 *
 * Answers that would need an unset business fact carry the same visible marker
 * as the policy pages rather than a made-up number (Hard Rule 9).
 */

import { createFileRoute } from "@tanstack/react-router";

import { ContentPage, Inline, Section, TBC } from "@/components/content/ContentPage";
import { commerce } from "@/config/site";
import { formatPKR } from "@/lib/format";
import { pageDescription, pageTitle, seoHead } from "@/lib/seo";

const DESCRIPTION = pageDescription(
  "Answers to the questions we are asked most: sizing, unstitched fabric, cash on delivery, exchanges, and how to track an order.",
);

export const Route = createFileRoute("/faqs")({
  head: () =>
    seoHead({
      title: pageTitle("FAQs"),
      description: DESCRIPTION,
      path: "/faqs",
    }),
  component: FaqsPage,
});

function FaqsPage() {
  return (
    <ContentPage
      title="Frequently asked questions"
      intro="The things people ask us most often, answered as directly as we can."
    >
      <Section heading="How do I know what size to order?">
        <p>
          Every product page carries a size guide with the actual garment measurements for that
          piece, not a generic chart. Measure a garment you already own and like the fit of, then
          compare — it is far more reliable than measuring yourself.
        </p>
        <p>
          If you are between sizes on a formal or bridal piece,{" "}
          <Inline href="/contact">ask us</Inline> before ordering. We would rather spend a message
          on it than have you arrange an exchange.
        </p>
      </Section>

      <Section heading="What does unstitched mean?">
        <p>
          Unstitched is fabric, not a finished garment: you receive the cloth — usually shirt,
          trouser and dupatta pieces — and have it stitched by your own tailor to your measurements.
          It is the normal way to buy lawn and khaddar in Pakistan and it gives you a fit no
          ready-to-wear size can match.
        </p>
        <p>
          Once fabric has been cut or stitched it cannot be exchanged, so check the colour and the
          piece count before you take it to a tailor.
        </p>
      </Section>

      <Section heading="Can I pay cash on delivery?">
        <p>
          Yes, and it is the default. You pay the courier when the parcel reaches you. Nothing is
          taken when you place the order. Card and bank transfer are not live yet.
        </p>
      </Section>

      <Section heading="How much is delivery?">
        <p>
          Free on orders over {formatPKR(commerce.freeDeliveryThreshold)}, anywhere in Pakistan.
          Below that it is{" "}
          {commerce.flatShippingRate === null ? (
            <TBC what="flat delivery rate" />
          ) : (
            formatPKR(commerce.flatShippingRate)
          )}
          . Full detail on the <Inline href="/shipping">shipping page</Inline>.
        </p>
      </Section>

      <Section heading="How long will my order take?">
        <p>
          Usually{" "}
          {commerce.deliveryEstimate === null ? (
            <TBC what="delivery timeframe" />
          ) : (
            commerce.deliveryEstimate
          )}{" "}
          once confirmed. Made-to-order pieces run to a timeline we agree with you before starting.
        </p>
      </Section>

      <Section heading="Where is my order?">
        <p>
          Put your order number and the phone number you used at checkout into the{" "}
          <Inline href="/track-order">tracking page</Inline>. It shows which of the six stages your
          order has reached. No account needed.
        </p>
      </Section>

      <Section heading="Can I exchange something?">
        <p>
          Yes, if it is unworn, unwashed, unaltered and still tagged, within{" "}
          {commerce.exchangeWindow === null ? (
            <TBC what="exchange window" />
          ) : (
            commerce.exchangeWindow
          )}{" "}
          of delivery. Made-to-order pieces and cut fabric are the exceptions. The{" "}
          <Inline href="/returns">exchange page</Inline> has the detail.
        </p>
      </Section>

      <Section heading="Do I need an account to order?">
        <p>
          No. Guest checkout is fully supported and always will be. An account only adds two things:
          your order history in one place, and a wishlist that follows you between devices.
        </p>
      </Section>

      <Section heading="Will a piece be restocked?">
        <p>
          Usually not. Pieces are cut in limited runs from fabric bought for that run, so when a
          colourway sells through it is generally gone rather than reordered. If you are watching
          something, that is a reason not to wait.
        </p>
      </Section>

      <Section heading="Are the colours accurate?">
        <p>
          We photograph in daylight and do not retouch fabric colour. Screens still differ, and deep
          reds and jewel tones are the hardest to reproduce. If an exact shade matters — for
          matching an existing outfit, say — <Inline href="/contact">ask us</Inline> and we will
          describe it honestly.
        </p>
      </Section>
    </ContentPage>
  );
}
