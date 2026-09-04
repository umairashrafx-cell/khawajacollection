/**
 * Contact. docs/BUILD-SPEC.pdf Phase 9 item 4.
 *
 * Every channel on this page is read from src/config/site.ts, and every one of
 * them is currently PLACEHOLDER. Rather than print "PLACEHOLDER" as if it were
 * an email address, each unset channel renders a visible marker and the page
 * still tells the visitor what they *can* do today — track an order, or use
 * the details once they exist.
 *
 * The one channel that always works is order tracking, because that needs no
 * business fact we do not have.
 */

import { createFileRoute } from "@tanstack/react-router";
import { Mail, MapPin, MessageCircle, PackageSearch } from "lucide-react";

import { ContentPage, Inline, Section, TBC } from "@/components/content/ContentPage";
import { PLACEHOLDER, contact } from "@/config/site";
import { pageDescription, pageTitle, seoHead } from "@/lib/seo";

const DESCRIPTION = pageDescription(
  "Get in touch with Khawaja Collection about an order, a size, or a made-to-order piece. Track an existing order with its order number.",
);

export const Route = createFileRoute("/contact")({
  head: () =>
    seoHead({
      title: pageTitle("Contact"),
      description: DESCRIPTION,
      path: "/contact",
    }),
  component: ContactPage,
});

function isSet(value: string): boolean {
  return value !== PLACEHOLDER && value.length > 0;
}

function ContactPage() {
  return (
    <ContentPage
      title="Contact"
      intro="Questions about a size, a fabric, or an order already on its way — this is where to start."
    >
      <Section heading="Track an order">
        <p>
          The fastest answer to "where is my order" is the{" "}
          <Inline href="/track-order">tracking page</Inline>. You need the order number from your
          confirmation and the phone number you gave at checkout. No account required.
        </p>
      </Section>

      <Section heading="How to reach us">
        <ul className="space-y-4">
          <li className="flex gap-3">
            <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-kc-muted" aria-hidden="true" />
            <span>
              <strong className="font-medium text-kc-ink">WhatsApp</strong>
              <br />
              {isSet(contact.whatsapp) ? contact.whatsapp : <TBC what="WhatsApp number" />}
              <br />
              <span className="text-xs text-kc-muted">
                Best for sizing, fabric questions and made-to-order enquiries.
              </span>
            </span>
          </li>

          <li className="flex gap-3">
            <Mail className="mt-0.5 h-4 w-4 shrink-0 text-kc-muted" aria-hidden="true" />
            <span>
              <strong className="font-medium text-kc-ink">Email</strong>
              <br />
              {isSet(contact.supportEmail) ? (
                <a
                  href={`mailto:${contact.supportEmail}`}
                  className="underline underline-offset-4 hover:text-kc-gold"
                >
                  {contact.supportEmail}
                </a>
              ) : (
                <TBC what="support email" />
              )}
              <br />
              <span className="text-xs text-kc-muted">
                Best for anything with an order number attached.
              </span>
            </span>
          </li>

          <li className="flex gap-3">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-kc-muted" aria-hidden="true" />
            <span>
              <strong className="font-medium text-kc-ink">Studio</strong>
              <br />
              {isSet(contact.address) ? contact.address : <TBC what="studio address" />}
              <br />
              {isSet(contact.hours) ? (
                <span className="text-xs text-kc-muted">{contact.hours}</span>
              ) : (
                <TBC what="opening hours" />
              )}
            </span>
          </li>

          <li className="flex gap-3">
            <PackageSearch className="mt-0.5 h-4 w-4 shrink-0 text-kc-muted" aria-hidden="true" />
            <span>
              <strong className="font-medium text-kc-ink">An existing order</strong>
              <br />
              <Inline href="/track-order">Track it here</Inline>
              <br />
              <span className="text-xs text-kc-muted">
                Quicker than writing to us, and available at any hour.
              </span>
            </span>
          </li>
        </ul>
      </Section>

      <Section heading="What to include">
        <p>
          If you are writing about an order, sending the order number in the first message saves a
          round trip. If it is about a specific piece, the product name or a link to its page is
          enough — we do not need a photograph unless something has arrived damaged, in which case
          one taken in daylight helps a great deal.
        </p>
      </Section>
    </ContentPage>
  );
}
