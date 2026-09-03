/**
 * Page gutter and max width. See docs/BUILD-SPEC.pdf Section 6.3:
 * 16px mobile, 24px tablet, 40px desktop, max content width 1440px.
 */

import type { ReactNode } from "react";

export function Container({
  children,
  className = "",
  as: Element = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section";
}) {
  return (
    <Element className={`mx-auto w-full max-w-[1440px] px-4 md:px-6 lg:px-10 ${className}`}>
      {children}
    </Element>
  );
}

/** Section 6.3 — vertical rhythm is 48px mobile, 96px desktop. */
export function Section({
  children,
  className = "",
  label,
}: {
  children: ReactNode;
  className?: string;
  label?: string;
}) {
  return (
    <section className={`py-12 lg:py-24 ${className}`} aria-label={label}>
      {children}
    </section>
  );
}
