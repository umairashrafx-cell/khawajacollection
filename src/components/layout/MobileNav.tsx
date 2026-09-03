/**
 * Mobile navigation sheet. See docs/BUILD-SPEC.pdf Section 10.2.
 *
 * Full-height, accordion category tree no more than two levels deep, account
 * links pinned to the bottom. Modal, so it traps focus and locks the page
 * behind it. Every link comes from src/config/nav.ts.
 */

import { useCallback, useEffect, useState } from "react";
import { ChevronDown, X } from "lucide-react";

import { accountNav, primaryNav } from "@/config/nav";
import { site } from "@/config/site";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { closeOverlay, useIsOverlayOpen } from "@/store/ui-store";
import { AppLink } from "./AppLink";

export default function MobileNav() {
  const open = useIsOverlayOpen("mobile-nav");
  const [expanded, setExpanded] = useState<string | null>(null);

  const close = useCallback(() => closeOverlay(), []);
  const panelRef = useFocusTrap<HTMLDivElement>(open, close);
  useBodyScrollLock(open);

  // Collapse the tree between visits so it always opens in a known state.
  useEffect(() => {
    if (!open) setExpanded(null);
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        type="button"
        aria-label="Close menu"
        onClick={close}
        className="absolute inset-0 bg-kc-ink/40"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Main navigation"
        tabIndex={-1}
        className="absolute inset-y-0 left-0 flex w-[88%] max-w-sm flex-col bg-kc-paper"
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-kc-line px-5">
          <span className="font-display text-lg tracking-[0.14em]">
            {site.shortMark}
            <span className="text-kc-gold">.</span>
          </span>
          <button
            type="button"
            onClick={close}
            aria-label="Close menu"
            className="-mr-2 flex h-11 w-11 items-center justify-center"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-5 py-2" aria-label="Categories">
          <ul>
            {primaryNav.map((section) => {
              const children = section.columns?.[0]?.links ?? [];
              const isOpen = expanded === section.label;

              if (children.length === 0) {
                return (
                  <li key={section.href} className="border-b border-kc-line">
                    <AppLink
                      href={section.href}
                      onClick={close}
                      className={`flex min-h-[52px] items-center text-sm uppercase tracking-[0.08em] ${
                        section.isSale ? "text-kc-sale" : ""
                      }`}
                    >
                      {section.label}
                    </AppLink>
                  </li>
                );
              }

              return (
                <li key={section.href} className="border-b border-kc-line">
                  <button
                    type="button"
                    onClick={() => setExpanded(isOpen ? null : section.label)}
                    aria-expanded={isOpen}
                    aria-controls={`mobile-nav-${section.label}`}
                    className="flex min-h-[52px] w-full items-center justify-between text-sm uppercase tracking-[0.08em]"
                  >
                    {section.label}
                    <ChevronDown
                      className={`h-4 w-4 text-kc-muted transition-transform ${isOpen ? "rotate-180" : ""}`}
                      aria-hidden="true"
                    />
                  </button>

                  <ul id={`mobile-nav-${section.label}`} hidden={!isOpen} className="pb-3">
                    <li>
                      <AppLink
                        href={section.href}
                        onClick={close}
                        className="flex min-h-[44px] items-center text-sm text-kc-ink"
                      >
                        All {section.label}
                      </AppLink>
                    </li>
                    {children.map((link) => (
                      <li key={link.href}>
                        <AppLink
                          href={link.href}
                          onClick={close}
                          className="flex min-h-[44px] items-center text-sm text-kc-charcoal"
                        >
                          {link.label}
                        </AppLink>
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="shrink-0 border-t border-kc-line bg-kc-sand px-5 py-3">
          <ul>
            {accountNav.map((link) => (
              <li key={link.href}>
                <AppLink
                  href={link.href}
                  onClick={close}
                  className="flex min-h-[44px] items-center text-sm text-kc-charcoal"
                >
                  {link.label}
                </AppLink>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
