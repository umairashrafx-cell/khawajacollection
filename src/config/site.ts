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
    "Khawaja Collection: premium Pakistani fashion for women and men, made in limited runs in Lahore.",
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
    country: "PK",
  },

  /**
   * Supplied 2026-09-04 as the daily trading window. WHICH DAYS was not
   * given, so this is the only place hours appear: the Organization JSON-LD
   * deliberately carries no `openingHoursSpecification`, because schema.org
   * requires a dayOfWeek and guessing "every day" would tell Google the shop
   * is open on a day it might be shut. Add the days and the markup can follow.
   */
  hours: "10:00 am to 8:00 pm",
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
   * TODO(Umair): the real exchange window, e.g. "7 days from delivery".
   * Same rule — the copy says "easy exchange" and no number until this is set.
   */
  exchangeWindow: null as string | null,
} as const;

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
export const paymentMethods: readonly {
  id: PaymentMethodId;
  label: string;
  isEnabled: boolean;
  note?: string;
}[] = [
  { id: "cod", label: "Cash on Delivery", isEnabled: true },
  { id: "card", label: "Card", isEnabled: false, note: "Coming soon" },
  { id: "bank_transfer", label: "Bank Transfer", isEnabled: false, note: "Coming soon" },
];
