/**
 * Site footer. See docs/BUILD-SPEC.pdf Section 11.1 item 12.
 *
 * Four link columns, a social row, payment and delivery icons, copyright.
 * Columns come from src/config/nav.ts.
 *
 * Guardrail 2: nothing here is invented. The studio address, hours and support
 * email are PLACEHOLDER in src/config/site.ts, so they are omitted rather than
 * filled in with something plausible — a wrong address in a footer is worse
 * than no address. Same for Instagram and TikTok, which stay out of the DOM
 * until real URLs exist rather than shipping as dead "#" links.
 */

import {
  Banknote,
  CreditCard,
  Facebook,
  Instagram,
  Landmark,
  Music2,
  Youtube,
  RefreshCw,
  Truck,
} from "lucide-react";

import { footerNav } from "@/config/nav";
import { PLACEHOLDER, commerce, contact, paymentMethods, site, social } from "@/config/site";
import { formatPKR } from "@/lib/format";
import { AppLink } from "./AppLink";

const PAYMENT_ICON = {
  cod: Banknote,
  card: CreditCard,
  bank_transfer: Landmark,
} as const;

export default function Footer() {
  // All four profiles are live as of 2026-09-04. The filter stays: it is what
  // keeps a placeholder out of the DOM if one is ever added or emptied, and a
  // social icon linking to "#" is worse than no icon. `href` is widened to
  // string because comparing a literal type to "#" is not a real check.
  const allSocial: { label: string; href: string; Icon: typeof Facebook }[] = [
    { label: "Facebook", href: social.facebook, Icon: Facebook },
    { label: "Instagram", href: social.instagram, Icon: Instagram },
    { label: "TikTok", href: social.tiktok, Icon: Music2 },
    { label: "YouTube", href: social.youtube, Icon: Youtube },
  ];
  const socialLinks = allSocial.filter((link) => link.href !== "#" && link.href !== PLACEHOLDER);

  const supportEmail: string = contact.supportEmail;
  const email = supportEmail === PLACEHOLDER ? null : supportEmail;

  return (
    <footer className="mt-24 border-t border-kc-line bg-kc-sand">
      <div className="mx-auto max-w-[1440px] px-4 py-14 md:px-6 lg:px-10">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-1">
            <p className="font-display text-xl tracking-[0.14em]">
              {site.shortMark}
              <span className="text-kc-gold">.</span>
            </p>
            <p className="mt-4 max-w-xs text-sm text-kc-charcoal">
              Premium Pakistani fashion, made in limited runs in Lahore. Considered cloth,
              hand-finished detail, honest pricing.
            </p>

            {socialLinks.length > 0 ? (
              <ul className="mt-6 flex gap-2">
                {socialLinks.map(({ label, href, Icon }) => (
                  <li key={label}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noreferrer noopener"
                      aria-label={`${site.name} on ${label}`}
                      className="flex h-11 w-11 items-center justify-center text-kc-charcoal transition-colors hover:text-kc-ink"
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}

            {email ? (
              <a
                href={`mailto:${email}`}
                className="mt-4 inline-block text-sm text-kc-charcoal underline-offset-4 hover:underline"
              >
                {email}
              </a>
            ) : null}
          </div>

          {footerNav.map((column) => (
            <nav key={column.heading} aria-label={column.heading}>
              <p className="kc-eyebrow text-kc-muted">{column.heading}</p>
              {/* space-y drops to nothing on mobile because each link now
                  carries its own 44px touch height (Section 15). Keeping both
                  would leave a footer of mostly gap. */}
              <ul className="mt-3 lg:mt-5 lg:space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <AppLink
                      href={link.href}
                      // inline-flex + min-h-11 gives the 44px target Section 15
                      // requires without changing how the text sits. Desktop
                      // has a cursor, so it keeps the tighter rhythm.
                      className="inline-flex min-h-11 min-w-11 items-center text-sm text-kc-charcoal transition-colors hover:text-kc-ink lg:min-h-0 lg:min-w-0"
                    >
                      {link.label}
                    </AppLink>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 grid gap-6 border-t border-kc-line pt-8 sm:grid-cols-2">
          <div>
            <p className="kc-eyebrow text-kc-muted">Payment</p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {paymentMethods.map((method) => {
                const Icon = PAYMENT_ICON[method.id];
                return (
                  <li
                    key={method.id}
                    className={`flex items-center gap-2 border border-kc-line bg-kc-white px-3 py-2 text-xs ${
                      method.isEnabled ? "text-kc-charcoal" : "text-kc-muted"
                    }`}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {method.label}
                    {method.note ? (
                      <span className="text-kc-muted">&mdash;&nbsp;{method.note}</span>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </div>

          <div>
            <p className="kc-eyebrow text-kc-muted">Delivery</p>
            <ul className="mt-4 space-y-2 text-xs text-kc-charcoal">
              <li className="flex items-center gap-2">
                <Truck className="h-4 w-4 shrink-0" aria-hidden="true" />
                Free delivery on orders over {formatPKR(commerce.freeDeliveryThreshold)}
              </li>
              <li className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 shrink-0" aria-hidden="true" />
                Easy exchange on unworn pieces
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-kc-line">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-2 px-4 py-5 text-xs text-kc-muted sm:flex-row sm:items-center sm:justify-between md:px-6 lg:px-10">
          <p>
            © {new Date().getFullYear()} {site.name}. All rights reserved.
          </p>
          <p>Cash on delivery available across Pakistan</p>
        </div>
      </div>
    </footer>
  );
}
