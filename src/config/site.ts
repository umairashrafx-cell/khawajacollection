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
  url: import.meta.env["VITE_SITE_URL"] ?? PLACEHOLDER,
  locale: "en-PK",
  currency: "PKR",
} as const;

/** Section 11.1 item 1 — max three, rotating, dismissible for the session. */
export const announcements = [
  "Free delivery across Pakistan on orders over PKR 5,000",
  "Cash on delivery available nationwide",
  "Easy exchange on unworn pieces",
] as const;

export const social = {
  facebook: "https://www.facebook.com/KCoffical",
  /** PLACEHOLDER — do not invent. Section 1.3. */
  instagram: "#",
  /** PLACEHOLDER — do not invent. Section 1.3. */
  tiktok: "#",
} as const;

export const contact = {
  /** PLACEHOLDER — Section 16, floating WhatsApp button stays inert until set. */
  whatsapp: PLACEHOLDER,
  /** PLACEHOLDER — Section 19. */
  supportEmail: PLACEHOLDER,
  /** PLACEHOLDER — Section 19. */
  address: PLACEHOLDER,
  /** PLACEHOLDER — Section 19. */
  hours: PLACEHOLDER,
} as const;

export const commerce = {
  /** Section 16 — free delivery above PKR 5,000. Integer PKR. */
  freeDeliveryThreshold: 5000,
  /**
   * TODO(Umair): set the real flat shipping rate before launch. Section 16
   * forbids inventing a number, so checkout must surface this as unset rather
   * than quietly charging a made-up amount.
   */
  flatShippingRate: null as number | null,
  /** Section 16 — human-readable, phone-friendly: KC-2026-00042. */
  orderNumberPrefix: "KC",
  /**
   * TODO(Umair): the real delivery window, e.g. "3-5 working days".
   * Section 11.3 puts a delivery estimate in the PDP trust row, but Guardrail 2
   * forbids inventing a timeline, so the row omits that line until this is set.
   */
  deliveryEstimate: null as string | null,
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
