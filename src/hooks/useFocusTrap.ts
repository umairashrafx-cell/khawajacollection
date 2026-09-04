/**
 * Modal overlay behaviour: trap Tab inside the panel, close on Escape, and
 * return focus to whatever opened it. See docs/BUILD-SPEC.pdf Section 15.
 *
 * For modal surfaces only — drawers, sheets and dialogs. A mega menu is not
 * modal and must not trap; see MegaMenu for that pattern.
 *
 * SPLIT INTO TWO EFFECTS IN PHASE 9, AFTER AN AUDIT FOUND ESCAPE DEAD ON THE
 * FIRST OPEN OF EVERY OVERLAY. All of this used to live in one effect that
 * began `if (!container) return`, so when the container ref was not populated
 * on the pass the effect happened to run — which is what happens the first
 * time a lazily-imported overlay like CartDrawer mounts — the Escape listener
 * was never bound at all. Opening the bag, pressing Escape and having nothing
 * happen is precisely what Section 15 says must not occur ("Escape always
 * closes"), and it only reproduced on the first open, which is why it survived
 * three phases.
 *
 * Escape is now bound on `active` alone. It cannot depend on a ref, because a
 * keyboard user's escape hatch must not depend on a render detail.
 */

import { useEffect, useRef } from "react";

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

export function useFocusTrap<T extends HTMLElement>(active: boolean, onClose: () => void) {
  const containerRef = useRef<T | null>(null);

  /* --- Escape. Bound whenever the overlay is open, ref or no ref. --------- */
  useEffect(() => {
    if (!active) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      onClose();
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [active, onClose]);

  /* --- Focus: move in, keep Tab inside, hand it back on close ------------- */
  useEffect(() => {
    if (!active) return;
    const container = containerRef.current;
    if (!container) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;

    const focusable = () =>
      Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement,
      );

    // Move focus in so the next Tab lands inside the panel, not behind it.
    const first = focusable()[0];
    if (first) first.focus();
    else container.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Tab") return;

      const items = focusable();
      if (items.length === 0) {
        event.preventDefault();
        return;
      }
      const firstItem = items[0];
      const lastItem = items[items.length - 1];
      if (!firstItem || !lastItem) return;

      if (event.shiftKey && document.activeElement === firstItem) {
        event.preventDefault();
        lastItem.focus();
      } else if (!event.shiftKey && document.activeElement === lastItem) {
        event.preventDefault();
        firstItem.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);

      // Restoring focus is what makes keyboard navigation survive an overlay,
      // but it must not fire when the effect merely re-ran while the panel is
      // still on screen (a lazy chunk resolving, StrictMode's double-invoke in
      // development). That yanks focus back to the opener behind an open
      // panel, which is the bug that led here.
      //
      // Two situations deserve a restore, and they are not the same:
      //   - focus is still inside the panel, so closing it would strand focus;
      //   - focus has already collapsed to <body>, which is what the browser
      //     does when the focused element is removed from the document. That
      //     is the normal close path, since the panel stops rendering before
      //     this cleanup runs.
      // Anything else means the user moved focus somewhere deliberately, and
      // stealing it back would be worse than doing nothing.
      // Named `focused` rather than `active` so it cannot be mistaken for the
      // hook's `active` flag, which means something else entirely.
      const focused = document.activeElement;
      const focusStranded = focused === null || focused === document.body;
      if (focusStranded || container.contains(focused)) {
        previouslyFocused?.focus?.();
      }
    };
  }, [active, onClose]);

  return containerRef;
}
