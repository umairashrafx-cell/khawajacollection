/**
 * The shared frame for the eight content pages.
 * docs/BUILD-SPEC.pdf Phase 9 item 4.
 *
 * ON `TBC`. Phase 9 item 4 is explicit: "For anything requiring real business
 * details (address, phone, timelines, refund windows), insert a clearly marked
 * PLACEHOLDER — do not invent them." Hard Rule 9 says the same. So a policy
 * page that would need a number we do not have renders a visible marker
 * instead, and the page still reads as a sentence around it.
 *
 * The marker is deliberately loud rather than tasteful. A muted placeholder
 * that blends into the copy is one that ships to production: this one is meant
 * to be impossible to miss on the page and trivial to grep for.
 */

import type { ReactNode } from "react";

import { Container } from "@/components/layout/Container";
import { AppLink } from "@/components/layout/AppLink";

export function ContentPage({
  title,
  intro,
  updated,
  children,
}: {
  title: string;
  intro?: string;
  /**
   * Shown on policy pages, where "when did this change" is the point.
   * ReactNode rather than string so an unset date can be a <TBC /> marker
   * instead of being cast into one.
   */
  updated?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Container>
      <article className="mx-auto max-w-2xl py-10 lg:py-16">
        <h1 className="font-display text-[30px] leading-tight md:text-[44px]">{title}</h1>
        {intro ? <p className="mt-4 text-base text-kc-charcoal">{intro}</p> : null}
        {updated ? <p className="mt-2 text-xs text-kc-muted">Last updated {updated}</p> : null}
        <div className="mt-10 space-y-10">{children}</div>
      </article>
    </Container>
  );
}

export function Section({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-xl text-kc-ink">{heading}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-kc-charcoal">{children}</div>
    </section>
  );
}

/**
 * A business fact Umair has not supplied yet. Every instance is listed in
 * docs/LAUNCH-CHECKLIST.md.
 */
/**
 * A known fact, or the badge that says it is missing.
 *
 * The pattern `value ?? <TBC what="…" />` appeared at nine call sites across
 * three legal pages, and every one of them had to remember both halves. This
 * makes forgetting the fallback impossible: pass the config value and the
 * label, and a null renders the badge automatically.
 */
export function Fact({ value, what }: { value: string | null; what: string }) {
  return value ? <>{value}</> : <TBC what={what} />;
}

export function TBC({ what }: { what: string }) {
  return (
    <mark className="mx-0.5 inline-block border border-kc-sale bg-kc-white px-1.5 py-0.5 text-xs font-medium uppercase tracking-wide text-kc-sale">
      Placeholder: {what}
    </mark>
  );
}

export function Bullets({ items }: { items: ReactNode[] }) {
  return (
    <ul className="list-disc space-y-2 pl-5">
      {items.map((item, index) => (
        // Static, authored copy — the list never reorders, so the index is a
        // stable identity here rather than the usual mistake.
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}

export function Inline({ href, children }: { href: string; children: ReactNode }) {
  return (
    <AppLink href={href} className="underline underline-offset-4 hover:text-kc-gold">
      {children}
    </AppLink>
  );
}
