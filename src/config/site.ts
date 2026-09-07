/**
 * Khawaja Collection — brand, commerce and contact configuration.
 * See docs/BUILD-SPEC.pdf Sections 1.3, 11.1 and 16.
 *
 * PLACEHOLDER values are deliberate. Guardrail 2: never invent a phone number,
 * address, price, delivery timeline, refund window, or social URL. Everything
 * marked PLACEHOLDER below is tracked in docs/LAUNCH-CHECKLIST.md (Phase 9)
 * and must be replaced before go-live.
 */

import type { PaymentMethodId, Province } from "@/types";

/** Sentinel for values Umair still has to supply. Grep for it before launch. */
export const PLACEHOLDER = "PLACEHOLDER" as const;

export const site = {
  name: "Khawaja Collection",
  shortMark: "KC",
  tagline: "Premium Pakistani fashion",
  description:
    "Khawaja Collection: premium Pakistani fashion for women and men — unstitched, ready to wear, formals, bridal and bedding. Cash on delivery across Pakistan.",
  /** Set VITE_SITE_URL on the host. Canonicals and the sitemap depend on it. */
  url: import.meta.env.VITE_SITE_URL ?? PLACEHOLDER,
  locale: "en-PK",
  currency: "PKR",
} as const;

/**
 * The build credit in the footer. Supplied by Umair on 2026-09-05.
 *
 * Config rather than a link written into Footer.tsx, for the same reason every
 * other link on this site is: nav.ts states the rule as "no hardcoded nav
 * links in JSX, ever". Changing the agency, or dropping the credit, should be
 * one line here.
 */
export const builtBy = {
  name: "Automa8",
  url: "https://www.automa8.co",
  /**
   * The A8 mark, supplied 2026-09-07.
   *
   * THE MARK ALONE, not the full lockup, and the reason is the credit bar it
   * sits in: 12px text in a 20px-tall row. The supplied artwork is a square
   * stacked lockup — mark, then "Automa8", then "AUTOMATE · CONNECT · GROW" —
   * and at any height that row can carry, the wordmark under the mark renders
   * about five pixels tall and the tagline about three. Shrinking a logo until
   * its own words are unreadable is worse for the agency than not showing it.
   *
   * So the mark is cropped out and the NAME STAYS AS TEXT beside it. Nothing
   * is lost: the words are still there, still selectable, still read aloud by
   * a screen reader, and the mark is doing the job a mark is for.
   *
   * Cropped from the original at 3x the display size and re-encoded: the
   * supplied PNG is 1254x1254 and 450KB, which is a large asset to put in the
   * footer of every page for a 38x20 credit.
   */
  mark: { src: "/automa8-mark.png", width: 38, height: 20 },
} as const;

/** Section 11.1 item 1 — max three, rotating, dismissible for the session. */
export const announcements = [
  "Free delivery across Pakistan on orders over PKR 5,000",
  "Cash on delivery available nationwide",
  "Easy exchange on unworn pieces",
] as const;

/**
 * Supplied by Umair on 2026-09-04. All four are real and live.
 *
 * The TikTok handle is spelled `khuwaja`, not `khawaja` like the others. That
 * is what he gave and it is not a typo to “correct” here — a silently
 * “fixed” handle is a dead link.
 */
export const social = {
  facebook: "https://www.facebook.com/KCoffical",
  instagram: "https://www.instagram.com/khawaja_collection786",
  tiktok: "https://www.tiktok.com/@khuwaja_collection786",
  youtube: "https://www.youtube.com/@khawajacollection-e6l",
} as const;

/**
 * Photographs for the "Follow Khawaja Collection" grid on the homepage.
 *
 * EMPTY, AND THAT IS WHY THE GRID IS GONE. It used to be six hardcoded
 * `/placeholders/product-NN-3x4.svg` tiles — the generated grey KC blocks —
 * sitting under a heading inviting people to follow the shop. Six identical
 * "PRODUCT IMAGE" squares do not invite anyone to follow anything; they say
 * the site is unfinished, which was the single most unfinished-looking thing
 * left on the homepage.
 *
 * A photograph cannot be invented the way a paragraph can be rewritten, so the
 * honest fix is to show the four real channel buttons and no tiles at all,
 * rather than filler. Put real image paths here — shop shots, product shots,
 * anything genuinely KC's — and the grid returns on its own.
 *
 * Paths are relative to /public, or absolute Storage URLs.
 */
export const socialTiles: readonly string[] = [];

/**
 * The Google tag. Supplied 2026-09-08 from Google Ads.
 *
 * A MEASUREMENT ID IS NOT A SECRET. It is emitted in the HTML of every page
 * that loads the tag, so anyone can read it — which is exactly why it belongs
 * in committed config and not in the env file beside the service role key.
 * Nothing can be done with it except send data to this property.
 *
 * ⚠ LOADED IN PRODUCTION BUILDS ONLY. A dev server hitting the same property
 * mixes local page views into real numbers, and the numbers are the entire
 * point of installing it — the first week of data is the baseline everything
 * later gets compared against, and there is no way to unpick localhost traffic
 * from it afterwards.
 *
 * ⚠ /privacy PROMISED THIS DID NOT EXIST, in as many words: "There is no Meta
 * Pixel and no Google Analytics on this site today. If that changes, this page
 * changes first." So it changed in the same commit. Anything added here that
 * sets a cookie or reports a visitor must do the same.
 */
export const analytics = {
  /** Google tag ID, e.g. G-XXXXXXXXXX. Empty string disables the tag. */
  measurementId: "G-7LDKK13XSX",
} as const;

export const contact = {
  /**
   * Supplied 2026-09-04. Stored in the +92 form Section 16 normalises to, so
   * it matches what the order repository writes. The wa.me links strip every
   * non-digit, so the display format here is free to be readable.
   */
  whatsapp: "+923338757747",
  phone: "+923338757747",

  /** Supplied 2026-09-04. */
  supportEmail: "hello@khawajacollection.com",

  /**
   * The shop. Structured rather than one string because the Organization
   * JSON-LD needs a real schema.org PostalAddress — for a single-location
   * business that is the difference between being a name and being a place
   * Google can put on a map.
   */
  address: {
    name: "Ameen Cloth House",
    street: "Katchery Road, Main Sadar Bazar",
    city: "Mandi Bahauddin",
    region: "Punjab",
    /** From the Google Business Profile listing, 2026-09-07. */
    postalCode: "50400",
    country: "PK",
  },

  /**
   * Trading hours. The window came 2026-09-04, the days on 2026-09-07.
   *
   * STRUCTURED RATHER THAN ONE STRING, because two consumers need two shapes:
   * the contact page wants a sentence a person reads, and the `Store` JSON-LD
   * wants schema.org's `dayOfWeek` names with 24-hour `opens`/`closes`. While
   * this was the string "10:00 am to 8:00 pm" the markup had to omit opening
   * hours entirely — schema.org requires a dayOfWeek, and guessing "every day"
   * would have told Google the shop was open on a day it is shut.
   *
   * FRIDAY IS ABSENT ON PURPOSE and is the whole reason the days matter.
   * Google renders a day with no specification as Closed, which is correct
   * here; a seventh entry would put customers outside a shut shop.
   */
  hours: {
    /** Display copy. */
    label: "Saturday to Thursday, 10:00 am to 8:00 pm (closed Friday)",
    /** schema.org day names, in trading-week order. */
    days: ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"] as readonly string[],
    /** 24-hour, as schema.org requires. */
    opens: "10:00",
    closes: "20:00",
  },
} as const;

/**
 * The Google Business Profile, live and verified 2026-09-07.
 *
 * EVERY VALUE HERE IS ONE GOOGLE PRODUCED FOR THIS LISTING. None is derived,
 * and there was briefly a src/lib/maps.ts that derived all of them from
 * `contact.address` on the reasonable-sounding grounds that an address written
 * down twice gets corrected once. It shipped, and Google resolved the address
 * to a different business in a different mall. The file is gone.
 *
 * What replaced the reasoning: an address is a SEARCH TERM to Google, and a
 * search term can return anything. These three are identifiers. They are also
 * cross-checked against each other — all three carry the CID
 * 0x5a4ab4352acaa893 — because one reference cannot confirm itself.
 *
 * Any of them being null is handled: ShopMap renders only the parts it has,
 * and nothing at all if it has none. Deliberately no "Placeholder:" badge like
 * the legal facts get. A missing refund window is something a customer is owed
 * and the badge is the right pressure there; a map or review button announcing
 * itself as broken just makes the shop look unfinished.
 */
export const googleBusiness = {
  /**
   * The map embed, from Google Maps -> Share -> Embed a map -> the `src` of
   * the iframe it hands you. A `https://www.google.com/maps/embed?pb=...` URL.
   *
   * ⚠ DO NOT GO BACK TO BUILDING THIS FROM THE ADDRESS. It was tried on
   * 2026-09-07 and shipped, and `?q=Khawaja Collection, Ameen Cloth House,
   * Katchery Road, Main Sadar Bazar, Mandi Bahauddin, 50400, Pakistan`
   * resolved to "K. Khadija & Kumail" — a different business, on a different
   * street, whose name and 4.0 rating were then displayed on our own contact
   * page. Google's geocoder is a guess, and in a bazaar with informal
   * addressing it is a bad one. A Place ID is an identity; an address string
   * is a search term, and a search term can return anything.
   */
  mapEmbedUrl:
    "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d4345.651836604552!2d73.48992767403696!3d32.585186051293114!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x391f7d6ce2df93ad%3A0x5a4ab4352acaa893!2sKhawaja%20Collection!5e0!3m2!1sen!2s!4v1788728637594!5m2!1sen!2s" as
      string | null,
  /**
   * Google Maps -> Share -> Copy link.
   *
   * Supplied 2026-09-07 and CHECKED AGAINST THE EMBED before being used: it
   * redirects to /maps/place/Khawaja+Collection/@32.5851861,73.4899277 and
   * carries the identifier 0x391f7d6ce2df93ad:0x5a4ab4352acaa893, which is the
   * same one inside `mapEmbedUrl`. Two references Google produced separately,
   * agreeing on one listing. That check is the whole difference between these
   * values and the address string they replaced.
   */
  placeUrl: "https://maps.app.goo.gl/3vCgfGL9SXwmVSVQ8" as string | null,
  /**
   * Business Profile -> "Ask for reviews". Supplied 2026-09-07.
   *
   * PROVEN TO BE THE SAME SHOP, not assumed. The id in a g.page/r link is
   * base64url of a small protobuf whose first field is the listing's CID as a
   * little-endian fixed64. `CZOoyio1tEpaEBM` decodes to
   * 09 93a8ca2a35b44a5a 1013, so the CID is 0x5a4ab4352acaa893 — the identifier
   * that also appears inside `mapEmbedUrl` and in what `placeUrl` redirects to.
   * Three references Google produced independently, all resolving to one
   * listing. After the geocoder confidently returned a stranger's shop for the
   * address string, agreement between independent references is the standard
   * anything pointing at a place has to meet here.
   */
  reviewUrl: "https://g.page/r/CZOoyio1tEpaEBM/review" as string | null,
} as const;

/** The shop address as display lines, in the order they should be read. */
export const addressLines: readonly string[] = [
  contact.address.name,
  contact.address.street,
  contact.address.city,
];

export const commerce = {
  /** Section 16 — free delivery above PKR 5,000. Integer PKR. */
  freeDeliveryThreshold: 5000,
  /**
   * Delivery below the free threshold. Supplied 2026-09-04. Integer PKR,
   * Section 16 — no floats, no paisa.
   *
   * Setting this is what unblocks selling. While it was null, /api/orders
   * refused every order under PKR 5,000 outright rather than charge a number
   * nobody had agreed to, so the shop could only take orders above the free
   * -delivery threshold.
   */
  flatShippingRate: 250 as number | null,
  /** Section 16 — human-readable, phone-friendly: KC-2026-00042. */
  orderNumberPrefix: "KC",
  /** Supplied 2026-09-04. Shown in the PDP trust row, /shipping and /faqs. */
  deliveryEstimate: "3 to 5 working days" as string | null,
  /**
   * Supplied by Umair on 2026-09-05. The last commerce placeholder.
   *
   * "7 days" and not "7 days from delivery": every place this renders already
   * supplies the second half — "within X of the parcel reaching you", "within
   * X of delivery" — so a value carrying its own preposition would read
   * "within 7 days from delivery of delivery".
   */
  exchangeWindow: "7 days" as string | null,
} as const;

/**
 * Who the shop legally IS, for /terms, /privacy and /refund-policy.
 *
 * These were written inline in the three route files as `<TBC>` badges, which
 * was right while nothing was known and wrong once anything was: the same
 * business name appeared in two files and the address in two more, so filling
 * them meant editing four places and hoping. One place now.
 *
 * ANYTHING STILL `null` RENDERS A VISIBLE RED BADGE ON THE LIVE SITE, and that
 * is the intent. Hard Rule 9 forbids inventing a jurisdiction or a retention
 * period, and a legal page that quietly states a plausible-sounding invention
 * is far worse than one that admits a gap. The badge is the pressure to fill
 * it.
 *
 * Supplied by Umair on 2026-09-05: name, address, governing law.
 * Still outstanding: the court, the dates, the refund window and retention.
 */
export const legal = {
  /** Trading name, as it should appear on an invoice. */
  businessName: "Khawaja Collection" as string | null,
  /**
   * The registered address. Deliberately NOT `contact.address`: that one
   * carries "Ameen Cloth House" because it is the shop a customer walks into,
   * and the two can diverge without either being wrong.
   */
  registeredAddress: "Katchery Road, Main Sadar Bazar, Mandi Bahauddin" as string | null,
  /** Renders as "governed by the laws of {X}". */
  governingLaw: "Pakistan" as string | null,
  /** Renders as "disputes fall to the courts of {X}". */
  courtJurisdiction: null as string | null,
  /**
   * The date each policy takes effect. One date; they are published together.
   *
   * From the privacy policy Umair supplied on 2026-09-08, which carried
   * "Last updated: September 8, 2026". IT ALSO CLEARS THE BADGE ON /terms AND
   * /refund-policy, because this field is shared and those pages are published
   * alongside it. If either is ever revised on its own, this stops being one
   * date and needs splitting rather than nudging.
   */
  effectiveDate: "8 September 2026" as string | null,
  /** From approving a refund to the money leaving. e.g. "7 to 10 working days". */
  refundProcessingTime: null as string | null,
  /**
   * How long order records are kept. Tax rules usually decide this, and here
   * they did: the privacy policy supplied 2026-09-08 cites FBR's requirement
   * that certain sales-tax records be retained for six years after the
   * relevant tax period.
   *
   * "six years" and not "6 years" — it renders mid-sentence, after "up to".
   */
  orderRetention: "six years" as string | null,
} as const;

/** Name and address as one phrase, for the data-controller line in /privacy. */
export function legalEntityLine(): string | null {
  if (!legal.businessName || !legal.registeredAddress) return null;
  return `${legal.businessName}, ${legal.registeredAddress}`;
}

/**
 * Whether `product.rating` and `product.reviewCount` come from real customers.
 *
 * They do not. They are generated values from the Phase 1 mock catalogue that
 * were carried into Postgres by the seed script, and Google treats
 * AggregateRating markup that is not backed by real reviews as fabricated
 * review content — a manual action, not a ranking nudge. So the PDP omits the
 * aggregateRating block entirely while this is false, and shows no star rating.
 *
 * Flip it to true only when reviews are genuinely collected from buyers. The
 * markup and the UI both come back on their own.
 */
export const hasRealReviews = false;

/**
 * Internal operational defaults. NOTHING HERE IS SHOWN TO A CUSTOMER, which
 * is why these are not PLACEHOLDER despite nobody having specified them:
 * Hard Rule 9 is about not inventing facts a customer will act on — a delivery
 * window, a refund period, an address. A threshold that decides when staff see
 * an amber warning on their own dashboard is a default, not a claim, and a
 * sensible one beats leaving the feature switched off.
 */
export const operations = {
  /** A variant at or below this count shows as low stock in the admin. */
  lowStockThreshold: 2,
} as const;

/** Section 16 — the seven shipping regions, in the order the select renders. */
export const provinces: readonly Province[] = [
  "Punjab",
  "Sindh",
  "Khyber Pakhtunkhwa",
  "Balochistan",
  "Gilgit-Baltistan",
  "Azad Jammu & Kashmir",
  "Islamabad Capital Territory",
];

/**
 * Section 11.5 — Cash on Delivery is the default and the only live method at
 * launch. Card and Bank Transfer render but stay disabled.
 */
/**
 * Every method that has ever been recorded on an order, for LABELLING ONE.
 *
 * Separate from `paymentMethods` below, and the split is the point. That list
 * is "what the shop offers today" and it shrinks; this one is "what a stored
 * `payment_method` value means" and it must never shrink, because an order is
 * a historical record. Both order-detail screens used to read the offer list
 * for their label, so removing a method would have made a past order that used
 * it display the raw column value — `bank_transfer` — to a customer.
 *
 * Typed as a complete Record, so adding a PaymentMethodId without a label is a
 * compile error rather than a string nobody notices in an order they will
 * never see.
 */
export const PAYMENT_LABELS: Record<PaymentMethodId, string> = {
  cod: "Cash on Delivery",
  card: "Card",
  bank_transfer: "Bank Transfer",
  jazzcash: "JazzCash",
  easypaisa: "Easypaisa",
};

/**
 * The display name for a stored `payment_method`.
 *
 * TAKES A `string`, NOT A `PaymentMethodId`, because that is what an order
 * actually carries: the value came out of a Postgres text column and through
 * an API, and the compiler refused to index the record with it — correctly.
 * An unrecognised value returns itself, which is what both screens did before
 * and is the right answer: showing the raw column beats showing nothing, and
 * it is legible enough for whoever has to work out where it came from.
 */
export function paymentLabel(id: string): string {
  return (PAYMENT_LABELS as Record<string, string | undefined>)[id] ?? id;
}

/**
 * What the shop actually takes. CASH ON DELIVERY, and nothing else.
 *
 * This listed five methods, four of them labelled "Coming soon" — in the
 * footer of every page and again at checkout. Umair asked for them gone on
 * 2026-09-07, and the request is right for a reason worth recording: "coming
 * soon" is a promise with no date behind it. Card and bank transfer had no
 * implementation at all, and the two wallets have never been run against a
 * sandbox (see src/lib/payments/jazzcash.ts). A customer choosing this shop
 * because it takes JazzCash would have found out at checkout that it does not.
 *
 * THE GATEWAY CODE IS NOT DELETED, only unlisted. The wallets return here the
 * moment their env flag is on — that is the whole point of the flag, and it
 * still cannot make the shop accept money it cannot collect, because the
 * server checks the merchant credentials again before sending anyone to a
 * gateway. Card and bank transfer are gone outright: there was nothing behind
 * them to switch on.
 */
export const paymentMethods: readonly {
  id: PaymentMethodId;
  label: string;
  isEnabled: boolean;
  note?: string;
}[] = [
  { id: "cod", label: PAYMENT_LABELS.cod, isEnabled: true },
  ...(import.meta.env.VITE_PAYMENTS_JAZZCASH === "on"
    ? [
        {
          id: "jazzcash" as const,
          label: PAYMENT_LABELS.jazzcash,
          isEnabled: true,
          note: "Pay with your JazzCash wallet",
        },
      ]
    : []),
  ...(import.meta.env.VITE_PAYMENTS_EASYPAISA === "on"
    ? [
        {
          id: "easypaisa" as const,
          label: PAYMENT_LABELS.easypaisa,
          isEnabled: true,
          note: "Pay with your Easypaisa wallet",
        },
      ]
    : []),
];
