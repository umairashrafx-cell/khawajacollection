/**
 * Privacy Policy. docs/BUILD-SPEC.pdf Phase 9 item 4.
 *
 * SUPPLIED BY UMAIR ON 2026-09-08 and reproduced faithfully. Everything before
 * that date was written from the codebase because nobody had authorised a
 * legal text; this is the authorised one, so it wins on substance, structure
 * and wording. Do not "improve" it — a privacy policy is a statement the
 * business makes, not copy to be edited for tone.
 *
 * TWO THINGS WERE ADDED TO IT, both because the draft predated a setting that
 * was already live and would otherwise have made the page false on arrival:
 *
 *   - Section 3 says the Analytics audiences are shared with Google Ads. Umair
 *     turned on "Import Google Analytics audiences" earlier the same day, which
 *     is remarketing, and Google's own personalised-advertising policy requires
 *     both the disclosure and an opt-out route. The draft mentioned Analytics
 *     and stopped there.
 *   - Section 4 lists Google Ads alongside Google Analytics, for the same
 *     reason: a reader asking who holds their data is asking about both
 *     companies, not only the one that collected it.
 *
 * THE PATTERN THAT KEEPS BITING. Twice on 2026-09-08 a sentence here was
 * falsified by a toggle in someone else's console — first "there is no Google
 * Analytics", then "there is no advertising retargeting". Nothing in this
 * repository produces a diff when Ads, Analytics, Supabase or a payment
 * gateway is switched on. Before flipping anything, read this page and ask
 * which sentence it just made false. The next likely one is section 1's note
 * about card numbers, which stops being trivially true the day a gateway goes
 * live.
 *
 * WHAT WAS LOST, deliberately, by adopting the supplied text: the old page
 * named the actual localStorage keys, the RLS behaviour behind order lookup,
 * and the fact that prices are recomputed server-side. Those made it checkable
 * against the source, which is a real virtue, but they were my words and this
 * is Umair's document. Section 3's mention of cookies for shopping-cart
 * functionality covers the same ground in his register.
 *
 * The retention period and the policy date come from this document and now
 * live in `legal` in src/config/site.ts, so /terms and /refund-policy pick the
 * date up too. Still placeholders elsewhere: court jurisdiction (terms) and
 * refund processing time (refund policy).
 *
 * It is not legal advice and does not pretend to be.
 */

import { createFileRoute } from "@tanstack/react-router";

import {
  Bullets,
  ContentPage,
  Fact,
  Inline,
  Outbound,
  Section,
} from "@/components/content/ContentPage";
import { contact, legal } from "@/config/site";
import { pageDescription, pageTitle, seoHead } from "@/lib/seo";

const DESCRIPTION = pageDescription(
  "What Khawaja Collection collects when you order or create an account, how it is used, who else handles it, and how to ask for it to be corrected or deleted.",
);

export const Route = createFileRoute("/privacy")({
  head: () =>
    seoHead({
      title: pageTitle("Privacy Policy"),
      description: DESCRIPTION,
      path: "/privacy",
    }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <ContentPage
      title="Privacy policy"
      intro="At Khawaja Collection, we respect your privacy and are committed to protecting the personal information you provide when using our website, placing an order, creating an account, or contacting us."
      updated={<Fact value={legal.effectiveDate} what="policy date" />}
    >
      <Section heading="1. Information we collect">
        <p>
          This Privacy Policy explains what information we collect, why we collect it, how we use
          it, and the choices available to you.
        </p>
        <p>
          <strong className="font-medium text-kc-ink">Information you provide to us.</strong> When
          you create an account, place an order, or contact us, you may provide:
        </p>
        <Bullets
          items={[
            "Full name",
            "Phone number",
            "Email address",
            "Delivery and billing address",
            "Account login information",
            "Order and purchase details",
            "Product preferences",
            "Information you provide when contacting us",
          ]}
        />
        <p>We only request information that is reasonably necessary to provide our services.</p>
        <p>
          <strong className="font-medium text-kc-ink">Payment information.</strong> If you make a
          payment through an online payment provider, your payment information may be processed
          directly by the relevant payment service provider. Khawaja Collection does not need to
          store your complete debit or credit card number or card security code.
        </p>
      </Section>

      <Section heading="2. How we use your information">
        <p>We may use your information to:</p>
        <Bullets
          items={[
            "Process and deliver your orders",
            "Confirm orders and payments",
            "Contact you about your order",
            "Handle returns, exchanges, refunds, and complaints",
            "Create and manage your customer account",
            "Provide customer support",
            "Improve our website, products, and services",
            "Understand website usage and performance",
            "Prevent fraud, abuse, or unauthorised activity",
            "Maintain business, accounting, and tax records",
            "Comply with applicable legal and regulatory requirements",
          ]}
        />
        <p>We do not sell your personal information to third parties.</p>
      </Section>

      <Section heading="3. Website analytics and cookies">
        <p>
          We use Google Analytics to understand how visitors use our website. This may include
          information such as:
        </p>
        <Bullets
          items={[
            "Pages visited",
            "Approximate location",
            "Device and browser information",
            "Traffic source",
            "Time spent on the website",
            "General website interaction data",
          ]}
        />
        <p>
          Analytics information helps us understand website performance and improve the shopping
          experience.
        </p>
        {/*
          NOT IN THE SUPPLIED DRAFT. See the note at the top of this file: the
          audience import was switched on the same day, and a policy that
          describes the measurement but not the advertising built on it is the
          claim that was already removed from this page once.
        */}
        <p>
          The audiences Google Analytics builds from these visits are also shared with Google Ads,
          so you may later see our ads on Google or on sites that carry its advertising. That is
          based on the pages you looked at, never on anything you typed into a form. There is no
          Meta Pixel and no other advertising network on this website. You can turn personalised ads
          off at{" "}
          <Outbound href="https://myadcenter.google.com">Google&rsquo;s My Ad Center</Outbound>, and
          you can stop the measurement itself with{" "}
          <Outbound href="https://tools.google.com/dlpage/gaoptout">
            Google&rsquo;s opt-out add-on
          </Outbound>
          .
        </p>
        <p>
          Our website may also use cookies and similar technologies for essential website
          functionality, account features, shopping-cart functionality, analytics, and other website
          operations. You can control or disable cookies through your browser settings. Some website
          features may not function correctly if essential cookies are disabled.
        </p>
      </Section>

      <Section heading="4. Who else handles your data">
        <p>
          We may share limited personal information with trusted service providers when necessary to
          operate our business. These may include:
        </p>
        <Bullets
          items={[
            "Google Analytics for website measurement and analytics.",
            "Google Ads for the advertising audiences built from that measurement.",
            "Supabase for database, account, and authentication services.",
            "Our hosting provider for hosting and delivering the website.",
            "Courier and delivery partners to deliver your order. They may receive your name, phone number, and delivery address.",
            "Payment providers, where applicable, to process payments securely.",
            "Other service providers where necessary to provide a service you have requested or where disclosure is required by law.",
          ]}
        />
        <p>
          We only provide service providers with information reasonably necessary for them to
          perform their services.
        </p>
      </Section>

      <Section heading="5. How we protect your information">
        <p>
          We take reasonable technical and organisational measures to protect your personal
          information against unauthorised access, alteration, disclosure, or destruction. However,
          no internet transmission or electronic storage system can be guaranteed to be completely
          secure.
        </p>
        <p>You should also protect your account password and avoid sharing it with others.</p>
      </Section>

      <Section heading="6. How long we keep your information">
        <p>
          We keep personal information only for as long as reasonably necessary for the purposes
          described in this Privacy Policy.
        </p>
        <p>
          Order and transaction records may be retained for up to{" "}
          <Fact value={legal.orderRetention} what="order retention period" /> where necessary for
          accounting, tax, legal, dispute-resolution, and business-record requirements. FBR
          currently states that certain sales-tax records and documents must be retained for six
          years after the relevant tax period.
        </p>
        <p>
          Some information may be retained for longer where required by law, necessary for an
          ongoing dispute, or needed to establish, exercise, or defend legal claims. Account
          information may be deleted when you request deletion, subject to information that we are
          legally required or reasonably entitled to retain.
        </p>
      </Section>

      <Section heading="7. Your choices and rights">
        <p>You may contact us to:</p>
        <Bullets
          items={[
            "Ask what personal information we hold about you",
            "Request correction of inaccurate information",
            "Request deletion of your account and personal information",
            "Ask about how your information is being used",
            "Request assistance with your personal information",
          ]}
        />
        <p>
          Please understand that deleting an account does not necessarily require us to delete
          transaction records that we are legally required to retain. To make a request,{" "}
          <Inline href="/contact">contact us</Inline> using the details below.
        </p>
      </Section>

      <Section heading="8. Children's privacy">
        <p>
          Our website is not intended to knowingly collect personal information from children
          without appropriate parental or guardian involvement. If you believe a child has provided
          personal information to us, please contact us so that we can review and, where
          appropriate, remove the information.
        </p>
      </Section>

      <Section heading="9. Third-party services">
        <p>
          Our website may contain links to third-party websites or services. We are not responsible
          for the privacy practices, security, or content of third-party websites. We recommend
          reviewing the privacy policy of any third-party service before providing it with personal
          information.
        </p>
      </Section>

      <Section heading="10. Changes to this Privacy Policy">
        <p>
          We may update this Privacy Policy from time to time to reflect changes to our website,
          services, technology, or legal requirements. When we make changes, we will update the
          &ldquo;Last updated&rdquo; date at the top of this page.
        </p>
      </Section>

      <Section heading="11. Contact us">
        <p>
          If you have questions about this Privacy Policy, or want to request access, correction, or
          deletion of your personal information, please contact us.
        </p>
        {/*
          Read from config rather than typed out again. The address, email and
          number already appear on /contact, in the footer and inside the
          Organization and Store structured data; a fourth hand-typed copy is
          the one left behind when a number changes.
        */}
        <address className="text-sm not-italic text-kc-charcoal">
          <span className="block font-medium text-kc-ink">{legal.businessName}</span>
          <span className="block">{contact.address.street}</span>
          <span className="block">
            {contact.address.city}, {contact.address.postalCode}, Pakistan
          </span>
          <span className="mt-3 block">
            Website: <Inline href="/">khawajacollection.com</Inline>
          </span>
          <span className="block">
            Email:{" "}
            <a
              href={`mailto:${contact.supportEmail}`}
              className="underline underline-offset-4 hover:text-kc-gold"
            >
              {contact.supportEmail}
            </a>
          </span>
          <span className="block">
            Phone / WhatsApp:{" "}
            <a
              href={`tel:${contact.phone}`}
              className="kc-price underline underline-offset-4 hover:text-kc-gold"
            >
              {contact.phone}
            </a>
          </span>
        </address>
      </Section>
    </ContentPage>
  );
}
