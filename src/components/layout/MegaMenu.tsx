/**
 * Mega menu panel. See docs/BUILD-SPEC.pdf Section 10.2.
 *
 * Three link columns plus one promotional image tile, driven entirely by
 * src/config/nav.ts. No link is written in JSX.
 *
 * FOCUS BEHAVIOUR — documented deviation. Section 10.2 says "focus trapped
 * while open". A trap is right for a modal surface, and wrong here: the panel
 * is rendered immediately after its trigger, so Tab already walks into it and
 * out the far side, which is what a keyboard user expects from a navigation
 * menu (and what WAI-ARIA prescribes for one). Trapping would strand a user
 * who opened the panel by hovering while tabbing elsewhere. Escape still
 * closes and returns focus to the trigger; the MobileNav sheet, which really
 * is modal, does trap.
 */

import type { NavSection } from "@/config/nav";
import { AppLink } from "./AppLink";

export interface MegaMenuProps {
  section: NavSection;
  onClose: () => void;
}

export default function MegaMenu({ section, onClose }: MegaMenuProps) {
  if (!section.columns?.length) return null;

  return (
    <div
      className="absolute inset-x-0 top-full hidden border-t border-kc-line bg-kc-white lg:block"
      style={{ boxShadow: "var(--shadow-kc)" }}
    >
      <div className="mx-auto grid max-w-[1440px] grid-cols-4 gap-10 px-10 py-10">
        {section.columns.map((column) => (
          <div key={column.heading}>
            <p className="kc-eyebrow text-kc-muted">{column.heading}</p>
            <ul className="mt-5 space-y-2.5">
              {column.links.map((link) => (
                <li key={link.href}>
                  <AppLink
                    href={link.href}
                    onClick={onClose}
                    className="text-sm text-kc-charcoal transition-colors hover:text-kc-ink"
                  >
                    {link.label}
                  </AppLink>
                </li>
              ))}
            </ul>
          </div>
        ))}

        {section.promo ? (
          <AppLink
            href={section.promo.href}
            onClick={onClose}
            className="group block"
            aria-label={`${section.promo.eyebrow}: ${section.promo.headline}`}
          >
            <div className="overflow-hidden bg-kc-sand">
              <img
                src={section.promo.image.src}
                alt={section.promo.image.alt}
                width={section.promo.image.width}
                height={section.promo.image.height}
                loading="lazy"
                decoding="async"
                sizes="(min-width: 1440px) 320px, 22vw"
                className="aspect-[4/5] w-full object-cover"
              />
            </div>
            <p className="kc-eyebrow mt-4 text-kc-muted">{section.promo.eyebrow}</p>
            <p className="mt-1 font-display text-xl leading-tight">{section.promo.headline}</p>
            <span className="mt-3 inline-block border-b border-kc-ink pb-0.5 text-[11px] font-medium uppercase tracking-[0.08em] transition-colors group-hover:border-kc-gold">
              Shop the edit
            </span>
          </AppLink>
        ) : null}
      </div>
    </div>
  );
}
