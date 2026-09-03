/**
 * Opens the search modal on the `/` key. See docs/BUILD-SPEC.pdf Section 10.2.
 *
 * Ignored while the caret is in a field or a contenteditable region, otherwise
 * typing a slash in the newsletter input or the search box itself would fight
 * the shortcut.
 */

import { useEffect } from "react";

import { openOverlay, useOverlay } from "@/store/ui-store";

export function useSearchHotkey(): void {
  const overlay = useOverlay();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;

      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target?.isContentEditable) {
        return;
      }
      // Something else is already open; one overlay at a time (Section 12).
      if (overlay !== null) return;

      event.preventDefault();
      openOverlay("search");
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [overlay]);
}
