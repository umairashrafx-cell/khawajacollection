/**
 * Exchange & Returns. docs/BUILD-SPEC.pdf Phase 9 item 4.
 *
 * The exchange window is `null` in src/config/site.ts and is left as a visible
 * placeholder. This is the single most dangerous number on the site to invent:
 * a customer reads "14 days", plans around it, and a wrong figure is a consumer
 * commitment KC never agreed to. Hard Rule 9 exists for exactly this.
 *
 * What the page *can* say without inventing anything is the shape of the
 * policy — what condition a piece must be in, what is not exchangeable, and
 * how to start the process. Those follow from how the shop works.
 */

import { createFileRoute } from "@tanstack/react-router";

import { Bullets, ContentPage, Inline, Section, TBC } from "@/components/content/ContentPage";
import { commerce } from "@/config/site";
import { pageDescription, pageTitle, seoHead } from "@/lib/seo";

const DESCRIPTION = pageDescription(
  "How to exchange an unworn Khawaja Collection piece, what condition it needs to be in, and which pieces cannot be exchanged.",
);

export const Route = createFileRoute("/returns")({
  head: () =>
    seoHead({
      title: pageTitle("Exchange & Returns"),
      description: DESCRIPTION,
      path: "/returns",
    }),
  component: ReturnsPage,
});

function ReturnsPage() {
  return (
    <ContentPage
      title="Exchange & returns"
      intro="If a piece does not fit or is not what you expected, we will exchange it. Here is exactly how that works."
    >
      <Section heading="The window">
        <p>
          You can request an exchange within{" "}
          {commerce.exchangeWindow === null ? (
            <TBC what="exchange window" />
          ) : (
            <strong>{commerce.exchangeWindow}</strong>
          )}{" "}
          of the parcel reaching you. Start it by <Inline href="/contact">writing to us</Inline>{" "}
          with your order number — please do not send anything back before we have replied, because
          we need to tell you where it goes.
        </p>
      </Section>

      <Section heading="Condition">
        <p>The piece has to come back in the state it left in. That means:</p>
        <Bullets
          items={[
            "Unworn, unwashed and unaltered — including no tailoring or stitching of unstitched fabric.",
            "Tags still attached, in the original packaging.",
            "Free of perfume, makeup and any other marks picked up after delivery.",
          ]}
        />
        <p>
          We check each returned piece against this before approving an exchange. If something
          arrives outside these conditions we will tell you why and send it back to you.
        </p>
      </Section>

      <Section heading="What cannot be exchanged">
        <Bullets
          items={[
            "Made-to-order pieces. These are cut to your measurements, so there is no second customer for them — this is confirmed with you before any work begins.",
            "Unstitched fabric that has been cut or stitched.",
            "Anything altered by a tailor.",
          ]}
        />
      </Section>

      <Section heading="If something arrived wrong or damaged">
        <p>
          This is not an exchange, it is our mistake, and it is handled differently. Send us a
          photograph taken in daylight along with your order number and we will put it right at our
          own cost. The conditions above do not apply.
        </p>
      </Section>

      <Section heading="Refunds">
        <p>
          Where a refund rather than an exchange is due, see the{" "}
          <Inline href="/refund-policy">refund policy</Inline>.
        </p>
      </Section>
    </ContentPage>
  );
}
