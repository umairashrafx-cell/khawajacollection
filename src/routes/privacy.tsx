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
 *   - which measurement scripts the root route actually loads
 *
 * THE "WHAT WE DO NOT DO" LIST PROMISED THERE WAS NO GOOGLE ANALYTICS, and
 * added "if that changes, this page changes first". It changed on 2026-09-08,
 * so the claim came out and a Measurement section went in, in the same commit
 * that added the tag. A privacy policy that is behind the code is worse than
 * no privacy policy: this one is checkable, which is the only thing that makes
 * it worth anything.
 *
 * IT HAPPENED TWICE THE SAME DAY. The replacement paragraph said there was no
 * advertising retargeting, and hours later "Import Google Analytics audiences"
 * was switched on in Google Ads — which is retargeting. That claim came out
 * too, and the opt-out links went in.
 *
 * THE LESSON IS NOT ABOUT ANALYTICS. Every sentence here that says what we do
 * NOT do is a claim with a shelf life, and the settings that falsify it live
 * in someone else's console where no diff will ever show up. Before switching
 * anything on in Ads, Analytics, Supabase or a payment gateway, read this page
 * first and ask which sentence it just made false.
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

import {
  Bullets,
  ContentPage,
  Fact,
  Inline,
  Outbound,
  Section,
} from "@/components/content/ContentPage";
import { legal, legalEntityLine } from "@/config/site";
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
      updated={<Fact value={legal.effectiveDate} what="policy date" />}
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
            "We do not sell, rent or share your details with anyone for marketing.",
            "We do not store card numbers, because we do not accept cards yet. Cash on delivery means no payment details reach us at all.",
            "We do not email you unless you asked us to, or unless it is about an order you placed.",
          ]}
        />
      </Section>

      <Section heading="Measurement">
        <p>
          We use Google Analytics to count visits and see which pages people read, so we know what
          to stock and what to fix. It sets its own cookies in your browser and tells Google your
          approximate location, the pages you opened and the device you used. It is not told your
          name, your address or your phone number, and nothing you type into an order form is sent
          to it.
        </p>
        <p>
          {/*
            THIS PARAGRAPH SAID THERE WAS NO RETARGETING until 2026-09-08, when
            "Import Google Analytics audiences" was switched on in Google Ads.
            That publishes the audiences Analytics builds here to the Ads
            account so they can be advertised to, which is exactly the thing
            the old sentence promised was not happening.

            Google's own personalised-advertising policy requires this
            disclosure and an opt-out route, so the paragraph is not merely
            honest, it is the condition of being allowed to run the ads.

            NOT "Do Not Track", which an earlier draft claimed would stop the
            script. It does not: DNT is a request in an HTTP header that a site
            may ignore, and Google Analytics ignores it. A content blocker
            actually blocks the request, and some browsers ship one turned on.
            Those are the true statements, so those are the ones made — a
            privacy policy that overstates the reader's protection is worse
            than one that promises less.
          */}
          The audiences Analytics builds from these visits are also shared with Google Ads, so you
          may later see our ads on Google or on sites that carry its advertising. That is based on
          the pages you looked at, never on anything you typed into a form. There is no Meta Pixel
          and no other advertising network on this site.
        </p>
        <p>
          You can turn personalised ads off at{" "}
          <Outbound href="https://myadcenter.google.com">Google&rsquo;s My Ad Center</Outbound>, and
          you can stop the measurement itself with{" "}
          <Outbound href="https://tools.google.com/dlpage/gaoptout">
            Google&rsquo;s opt-out add-on
          </Outbound>
          . Any content blocker you use will stop this script loading, as will a browser that blocks
          trackers by default, and the shop works exactly the same without it.
        </p>
      </Section>

      <Section heading="Who else handles your data">
        <Bullets
          items={[
            "Google Analytics — measurement, as described above.",
            "Google Ads — the advertising audiences built from that measurement.",
            "Supabase — our database and sign-in provider, where orders and accounts are stored.",
            "Our hosting provider, which processes the requests your browser makes.",
            "The courier delivering your parcel, who receives your name, address and phone number and nothing else.",
          ]}
        />
      </Section>

      <Section heading="How long we keep it">
        <p>
          Order records are kept for{" "}
          <Fact value={legal.orderRetention} what="order retention period" />, which we need for
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
          The data controller is{" "}
          <Fact value={legalEntityLine()} what="registered business name and address" />.
        </p>
      </Section>
    </ContentPage>
  );
}
