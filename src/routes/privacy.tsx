/**
 * Privacy Policy. docs/BUILD-SPEC.pdf Phase 9 item 4.
 *
 * THIS ONE IS DIFFERENT FROM THE OTHER POLICY PAGES. A privacy policy is not
 * marketing copy — it is a statement about what the software actually does,
 * and this codebase is the source of truth for most of it. So the sections
 * below describe real behaviour I can point at:
 *
 *   - the localStorage keys in src/store/ (kc-cart-v1, kc-wishlist-v1)
 *   - the columns in supabase/migrations/0001_schema.sql
 *   - Supabase Auth as the only place a password lives
 *   - the fact that no analytics or advertising script is loaded today
 *
 * Where the answer depends on a business decision instead — a data controller
 * address, a retention period, who to complain to — it is a visible
 * placeholder, because inventing those is both a Hard Rule 9 violation and a
 * legal claim nobody authorised.
 *
 * It is not legal advice and does not pretend to be. The launch checklist says
 * it needs review before go-live.
 */

import { createFileRoute } from "@tanstack/react-router";

import { Bullets, ContentPage, Inline, Section, TBC } from "@/components/content/ContentPage";
import { pageDescription, pageTitle, seoHead } from "@/lib/seo";

const DESCRIPTION = pageDescription(
  "What Khawaja Collection stores about you, where it is kept, what stays only in your own browser, and what we do not collect.",
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
      intro="What we store, why, and what never leaves your own browser."
      updated={<TBC what="policy date" />}
    >
      <Section heading="What stays on your device">
        <p>
          Your bag and your wishlist are kept in your browser's local storage, under the keys{" "}
          <code className="kc-price text-xs">kc-cart-v1</code> and{" "}
          <code className="kc-price text-xs">kc-wishlist-v1</code>. While you are signed out, that
          data never reaches us — it is on your device and nowhere else. Clearing your browser data
          erases it, and we cannot recover it for you.
        </p>
        <p>
          If you sign in, your wishlist is also saved to your account so it follows you between
          devices. Your bag is not.
        </p>
      </Section>

      <Section heading="What we store when you order">
        <p>Placing an order stores exactly what is needed to deliver it and to let you track it:</p>
        <Bullets
          items={[
            "Your name, phone number and delivery address.",
            "Your email address, if you gave one.",
            "What you ordered, the size and colour, and the price at the time of ordering.",
            "Your chosen payment method and the order's status.",
            "Any delivery note you added.",
          ]}
        />
        <p>
          Prices are recalculated on our server when the order is placed rather than taken from your
          browser, so the amount recorded is always the real one.
        </p>
      </Section>

      <Section heading="If you create an account">
        <p>
          Accounts are handled by Supabase Auth. Your password is stored by them as a hash — we
          never see it, and neither we nor anyone with access to our database can read it. We store
          your email address, the name you choose to display, and any delivery addresses you save.
        </p>
        <p>
          Orders you place while signed in are linked to your account so they appear in your order
          history. Orders placed as a guest are not linked to anything and can only be found with
          the order number plus the phone number used.
        </p>
      </Section>

      <Section heading="Who can see your order">
        <p>
          Nobody but you and us. Order records are not readable by the website running in anyone's
          browser — the database refuses those requests outright. Reading an order requires either
          being signed in as the account that placed it, or knowing both the order number and the
          matching contact number. A wrong pairing returns the same "not found" as an order number
          that does not exist, so the tracking page cannot be used to discover which orders exist.
        </p>
      </Section>

      <Section heading="What we do not do">
        <Bullets
          items={[
            "We load no analytics, advertising or social tracking scripts. There is no Meta Pixel and no Google Analytics on this site today. If that changes, this page changes first.",
            "We do not sell, rent or share your details with anyone for marketing.",
            "We do not store card numbers, because we do not accept cards yet. Cash on delivery means no payment details reach us at all.",
            "We do not email you unless you asked us to, or unless it is about an order you placed.",
          ]}
        />
      </Section>

      <Section heading="Who else handles your data">
        <Bullets
          items={[
            "Supabase — our database and sign-in provider, where orders and accounts are stored.",
            "Our hosting provider, which processes the requests your browser makes.",
            "The courier delivering your parcel, who receives your name, address and phone number and nothing else.",
          ]}
        />
      </Section>

      <Section heading="How long we keep it">
        <p>
          Order records are kept for <TBC what="order retention period" />, which we need for
          accounting and for handling exchanges. Account data is kept until you ask us to delete it.
        </p>
      </Section>

      <Section heading="Your choices">
        <p>
          You can ask us what we hold about you, ask for it to be corrected, or ask us to delete
          your account and its data. <Inline href="/contact">Write to us</Inline> and we will do it.
          Deleting your account does not erase order records we are required to keep for accounting,
          but it does unlink them from you.
        </p>
        <p>
          The data controller is <TBC what="registered business name and address" />.
        </p>
      </Section>
    </ContentPage>
  );
}
