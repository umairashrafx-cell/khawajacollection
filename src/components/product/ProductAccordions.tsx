/**
 * Below-the-fold accordion. See docs/BUILD-SPEC.pdf Section 11.3:
 * Description, Details & Fabric, Size Guide, Shipping Information,
 * Exchange & Return.
 *
 * Built on <details>/<summary> rather than a JS accordion. It costs no
 * JavaScript, it is keyboard and screen-reader correct without any ARIA of our
 * own, and — the reason that matters here — the panel content is in the
 * server-rendered HTML, so the product description is crawlable whether or not
 * anyone opens it.
 *
 * Guardrail 2: the shipping and exchange panels state only what config
 * actually knows. Delivery timelines and the exchange window are PLACEHOLDER
 * until Umair supplies them, so those sentences are omitted rather than
 * invented.
 */

import { ChevronDown } from "lucide-react";

import { mensSizes, sizeGuideNote, womensSizes } from "@/config/size-guide";
import { commerce, contact, PLACEHOLDER } from "@/config/site";
import { formatPKR, labelFromSlug } from "@/lib/format";
import type { Product } from "@/types";
import { SizeTable } from "./SizeGuideDialog";

export function ProductAccordions({ product }: { product: Product }) {
  const details = [
    product.fabric ? `Fabric: ${product.fabric}` : null,
    product.pieces ? `Pieces: ${product.pieces}` : null,
    product.subcategorySlug
      ? `Category: ${labelFromSlug(product.subcategorySlug, product.categorySlug)}`
      : null,
    product.variants[0]?.sku ? `SKU: ${product.variants[0].sku}` : null,
  ].filter((line): line is string => line !== null);

  const supportEmail: string = contact.supportEmail;
  const email = supportEmail === PLACEHOLDER ? null : supportEmail;

  return (
    <div className="divide-y divide-kc-line border-y border-kc-line">
      <Panel title="Description" defaultOpen>
        {product.description.split("\n\n").map((paragraph) => (
          <p key={paragraph.slice(0, 32)} className="mb-3 last:mb-0">
            {paragraph}
          </p>
        ))}
      </Panel>

      <Panel title="Details & Fabric">
        <ul className="space-y-1.5">
          {details.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        {product.care ? <p className="mt-3">{product.care}</p> : null}
      </Panel>

      <Panel title="Size Guide">
        <SizeTable rows={product.categorySlug === "men" ? mensSizes : womensSizes} />
        <p className="mt-4 text-xs text-kc-muted">{sizeGuideNote}</p>
      </Panel>

      <Panel title="Shipping Information">
        <ul className="space-y-1.5">
          <li>
            Free delivery on orders over {formatPKR(commerce.freeDeliveryThreshold)}, anywhere in
            Pakistan.
          </li>
          <li>Cash on delivery is available nationwide.</li>
          {commerce.flatShippingRate !== null ? (
            <li>Below that, delivery is {formatPKR(commerce.flatShippingRate)} flat.</li>
          ) : null}
          {commerce.deliveryEstimate !== null ? (
            <li>Orders usually arrive within {commerce.deliveryEstimate}.</li>
          ) : null}
          {product.isMadeToOrder ? (
            <li>
              Made-to-order pieces are cut after you enquire, so they take longer than stocked
              items. We confirm the timeline with you before starting.
            </li>
          ) : null}
        </ul>
      </Panel>

      <Panel title="Exchange & Return">
        <ul className="space-y-1.5">
          <li>Unworn pieces with tags attached can be exchanged.</li>
          {commerce.exchangeWindow !== null ? (
            <li>Exchanges are accepted within {commerce.exchangeWindow}.</li>
          ) : null}
          <li>Made-to-order and altered pieces cannot be exchanged.</li>
          {email ? (
            <li>
              To start an exchange, email{" "}
              <a href={`mailto:${email}`} className="underline underline-offset-4">
                {email}
              </a>{" "}
              with your order number.
            </li>
          ) : (
            <li>To start an exchange, contact us with your order number.</li>
          )}
        </ul>
      </Panel>
    </div>
  );
}

function Panel({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details className="group" open={defaultOpen}>
      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium text-kc-ink [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDown
          className="h-4 w-4 shrink-0 text-kc-muted transition-transform group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>
      <div className="pb-5 text-sm leading-relaxed text-kc-charcoal">{children}</div>
    </details>
  );
}
