/**
 * Shipping. docs/BUILD-SPEC.pdf Phase 9 item 4 and Section 16.
 *
 * The free-delivery threshold is a real configured number (PKR 5,000, Section
 * 16) so it is stated plainly. The flat rate below that threshold and the
 * delivery window are both `null` in src/config/site.ts, and both are exactly
 * the kind of fact Hard Rule 9 forbids inventing — a customer plans around a
 * delivery estimate, and a wrong one is a broken promise rather than a typo.
 * They render as visible placeholders.
 *
 * Checkout enforces the same rule from the other side: an order that would
 * need the unset flat rate is refused rather than charged a guessed amount.
 */

import { createFileRoute } from "@tanstack/react-router";

import { Bullets, ContentPage, Inline, Section, TBC } from "@/components/content/ContentPage";
import { commerce, provinces } from "@/config/site";
import { formatPKR } from "@/lib/format";
import { pageDescription, pageTitle, seoHead } from "@/lib/seo";

const DESCRIPTION = pageDescription(
  `Khawaja Collection delivers across Pakistan, with free delivery on orders over ${formatPKR(
    commerce.freeDeliveryThreshold,
  )}. Cash on delivery available nationwide.`,
);

export const Route = createFileRoute("/shipping")({
  head: () =>
    seoHead({
      title: pageTitle("Shipping"),
      description: DESCRIPTION,
      path: "/shipping",
    }),
  component: ShippingPage,
});

function ShippingPage() {
  return (
    <ContentPage
      title="Shipping"
      intro="We deliver across Pakistan. Here is what it costs, how long it takes, and how to follow a parcel."
    >
      <Section heading="Delivery charges">
        <Bullets
          items={[
            <>
              Orders over <strong>{formatPKR(commerce.freeDeliveryThreshold)}</strong> ship free,
              anywhere in Pakistan.
            </>,
            <>
              Below that, delivery costs{" "}
              {commerce.flatShippingRate === null ? (
                <TBC what="flat delivery rate" />
              ) : (
                <strong>{formatPKR(commerce.flatShippingRate)}</strong>
              )}
              .
            </>,
            "The charge you see at checkout is the charge you pay. Nothing is added afterwards.",
          ]}
        />
      </Section>

      <Section heading="How long it takes">
        <p>
          Once your order is confirmed, delivery usually takes{" "}
          {commerce.deliveryEstimate === null ? (
            <TBC what="delivery timeframe" />
          ) : (
            <strong>{commerce.deliveryEstimate}</strong>
          )}
          . Made-to-order bridal and formal pieces are different: we agree a timeline with you
          before work starts, and that timeline replaces this one.
        </p>
        <p>
          Public holidays and wedding season both slow couriers down. If a parcel is running late we
          would rather tell you than let you wonder — <Inline href="/contact">write to us</Inline>{" "}
          and we will chase it.
        </p>
      </Section>

      <Section heading="Where we deliver">
        <p>We ship to all seven regions:</p>
        <Bullets items={provinces.map((province) => province)} />
        <p className="text-xs text-kc-muted">
          Some remote areas are served by a partner courier and can take longer than the estimate
          above.
        </p>
      </Section>

      <Section heading="Paying on delivery">
        <p>
          Cash on delivery is available nationwide and is the default at checkout. You pay the
          courier when the parcel reaches you — nothing is taken from you when you place the order.
          Card and bank transfer are not live yet.
        </p>
      </Section>

      <Section heading="Following your order">
        <p>
          Every order gets a number in the form <span className="kc-price">KC-2026-00042</span>.
          Enter it on the <Inline href="/track-order">tracking page</Inline> along with the phone
          number you used at checkout and you will see exactly which of the six stages it has
          reached. You do not need an account.
        </p>
      </Section>
    </ContentPage>
  );
}
