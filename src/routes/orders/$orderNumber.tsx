/**
 * Order confirmation. See docs/BUILD-SPEC.pdf Phase 7:
 * "Order confirmation page with the summary and the order number."
 *
 * The page shows the order number and what happens next, and links straight to
 * tracking. It deliberately does NOT fetch the order: the confirmation URL
 * carries only an order number, and Section 11.6 requires a contact detail
 * alongside it before any order data is returned. Rendering the address here
 * from the number alone would be exactly the enumeration hole Section 8.3
 * forbids.
 *
 * noindex — a confirmation page has nothing to offer a search engine.
 */

import { createFileRoute } from "@tanstack/react-router";
import { Check, Copy, Truck } from "lucide-react";
import { useState } from "react";

import { AppLink } from "@/components/layout/AppLink";
import { Container } from "@/components/layout/Container";
import { commerce, contact, PLACEHOLDER } from "@/config/site";

export const Route = createFileRoute("/orders/$orderNumber")({
  head: ({ params }) => ({
    meta: [
      { title: `Order ${params.orderNumber} | Khawaja Collection` },
      { name: "description", content: "Your Khawaja Collection order is confirmed." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ConfirmationPage,
});

function ConfirmationPage() {
  const { orderNumber } = Route.useParams();
  const [copied, setCopied] = useState(false);

  const supportEmail: string = contact.supportEmail;
  const email = supportEmail === PLACEHOLDER ? null : supportEmail;

  async function copy() {
    try {
      await navigator.clipboard.writeText(orderNumber);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked — the number is on screen to copy by hand.
    }
  }

  return (
    <Container>
      <div className="mx-auto max-w-2xl py-14 lg:py-20">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-kc-success">
          <Check className="h-6 w-6 text-kc-white" aria-hidden="true" />
        </div>

        <h1 className="mt-6 font-display text-[28px] leading-tight md:text-[40px]">
          Thank you. Your order is placed.
        </h1>
        <p className="mt-3 text-sm text-kc-charcoal">
          We are preparing it now. Keep your order number — you will need it, and the phone number
          you gave us, to track delivery.
        </p>

        <div className="mt-8 border border-kc-line bg-kc-white p-6">
          <p className="kc-eyebrow text-kc-muted">Order number</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <p className="kc-price font-display text-2xl tracking-wide">{orderNumber}</p>
            <button
              type="button"
              onClick={copy}
              className="flex min-h-9 items-center gap-1.5 border border-kc-line px-3 text-xs text-kc-charcoal hover:border-kc-ink"
            >
              <Copy className="h-3.5 w-3.5" aria-hidden="true" />
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>

        <ul className="mt-8 space-y-3 text-sm text-kc-charcoal">
          <li className="flex gap-2.5">
            <Truck className="mt-0.5 h-4 w-4 shrink-0 text-kc-muted" aria-hidden="true" />
            <span>
              Cash on delivery. Please have {""}
              <span className="kc-price">the order total</span> ready for the courier.
            </span>
          </li>
          {commerce.deliveryEstimate !== null ? (
            <li className="flex gap-2.5">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-kc-muted" aria-hidden="true" />
              <span>Orders usually arrive within {commerce.deliveryEstimate}.</span>
            </li>
          ) : null}
          {email ? (
            <li className="flex gap-2.5">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-kc-muted" aria-hidden="true" />
              <span>
                Questions? Email{" "}
                <a href={`mailto:${email}`} className="underline underline-offset-4">
                  {email}
                </a>{" "}
                with your order number.
              </span>
            </li>
          ) : null}
        </ul>

        <div className="mt-10 flex flex-wrap gap-3">
          <AppLink
            href="/track-order"
            className="flex min-h-11 items-center bg-kc-ink px-7 text-[12px] font-medium uppercase tracking-[0.08em] text-kc-paper"
          >
            Track this order
          </AppLink>
          <AppLink
            href="/new-arrivals"
            className="flex min-h-11 items-center border border-kc-ink px-7 text-[12px] font-medium uppercase tracking-[0.08em] text-kc-ink"
          >
            Continue shopping
          </AppLink>
        </div>
      </div>
    </Container>
  );
}
