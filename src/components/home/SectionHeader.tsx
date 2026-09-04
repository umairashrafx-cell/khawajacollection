/**
 * Shared section heading: eyebrow, serif title, optional "View all" link.
 * See docs/BUILD-SPEC.pdf Sections 6.2 and 11.1.
 */

import { AppLink } from "@/components/layout/AppLink";

export interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: { label: string; href: string };
  /** Inverts for the sale block, which sits on ink. */
  tone?: "default" | "inverse";
  /** Every section title is an h2; the page has exactly one h1 (Section 13). */
  as?: "h2" | "h3";
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
  tone = "default",
  as: Heading = "h2",
}: SectionHeaderProps) {
  const inverse = tone === "inverse";

  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-x-6 gap-y-3 md:mb-9">
      <div>
        {eyebrow ? (
          <p className={`kc-eyebrow ${inverse ? "text-kc-paper/70" : "text-kc-muted"}`}>
            {eyebrow}
          </p>
        ) : null}
        <Heading
          className={`mt-2 font-display text-[22px] leading-tight md:text-[32px] ${
            inverse ? "text-kc-paper" : "text-kc-ink"
          }`}
        >
          {title}
        </Heading>
        {description ? (
          <p
            className={`mt-2 max-w-xl text-sm ${inverse ? "text-kc-paper/75" : "text-kc-charcoal"}`}
          >
            {description}
          </p>
        ) : null}
      </div>

      {action ? (
        <AppLink
          href={action.href}
          className={`inline-flex min-h-11 items-center border-b pb-0.5 text-[11px] font-medium uppercase tracking-[0.08em] transition-colors lg:min-h-0 ${
            inverse
              ? "border-kc-paper/40 text-kc-paper hover:border-kc-paper"
              : "border-kc-ink text-kc-ink hover:border-kc-gold"
          }`}
        >
          {action.label}
        </AppLink>
      ) : null}
    </div>
  );
}
