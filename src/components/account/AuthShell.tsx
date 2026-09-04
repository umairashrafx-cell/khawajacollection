/**
 * The frame every auth page sits in.
 *
 * Section 7 puts /account behind noindex; the same applies to sign-in, which
 * has nothing for a search engine and everything for a phisher's SERP result.
 * Each route sets its own robots tag — this file is only the layout.
 *
 * Where sign-in sends someone afterwards is decided by `safeNext` in
 * src/lib/auth/safe-next.ts, not here.
 */

import type { ReactNode } from "react";

import { AppLink } from "@/components/layout/AppLink";
import { Container } from "@/components/layout/Container";

export function AuthShell({
  title,
  intro,
  children,
  footer,
}: {
  title: string;
  intro?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <Container>
      <div className="mx-auto max-w-md py-10 lg:py-16">
        <h1 className="font-display text-[28px] leading-tight md:text-[34px]">{title}</h1>
        {intro ? <p className="mt-3 text-sm text-kc-charcoal">{intro}</p> : null}
        <div className="mt-8">{children}</div>
        {footer ? <div className="mt-8 border-t border-kc-line pt-6 text-sm">{footer}</div> : null}
      </div>
    </Container>
  );
}

/** The one submit button shape shared by the auth forms. */
export function SubmitButton({ busy, children }: { busy: boolean; children: ReactNode }) {
  return (
    <button
      type="submit"
      disabled={busy}
      className="min-h-11 w-full bg-kc-ink px-6 text-sm tracking-wide text-kc-white transition-opacity disabled:opacity-60"
    >
      {children}
    </button>
  );
}

/**
 * Errors are announced, not just coloured. `role="alert"` means a screen
 * reader hears "that email and password do not match" without the user having
 * to go hunting for what changed after they pressed the button.
 */
export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="mb-4 border border-kc-sale bg-kc-white p-3 text-sm text-kc-sale">
      {message}
    </p>
  );
}

export function AuthLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <AppLink href={href} className="underline underline-offset-4 hover:text-kc-gold">
      {children}
    </AppLink>
  );
}
