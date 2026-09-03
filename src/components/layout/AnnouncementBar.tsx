/**
 * Rotating announcement bar. See docs/BUILD-SPEC.pdf Section 11.1 item 1.
 *
 * Three messages maximum, read from src/config/site.ts. Dismissible, and the
 * dismissal is remembered for the session.
 */

import { useEffect, useState } from "react";
import { X } from "lucide-react";

import { announcements } from "@/config/site";

const DISMISS_KEY = "kc-announcement-dismissed-v1";
const ROTATE_MS = 5000;

export default function AnnouncementBar() {
  const [index, setIndex] = useState(0);
  // Starts false so the server and first client render agree. A visitor who
  // dismissed the bar earlier in the session sees it for one frame.
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      if (window.sessionStorage.getItem(DISMISS_KEY) === "1") setDismissed(true);
    } catch {
      // Private mode or storage disabled — show the bar.
    }
  }, []);

  useEffect(() => {
    if (dismissed || announcements.length < 2) return;
    // Section 6.5 — reduced motion means no rotation, just the first message.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timer = window.setInterval(
      () => setIndex((i) => (i + 1) % announcements.length),
      ROTATE_MS,
    );
    return () => window.clearInterval(timer);
  }, [dismissed]);

  if (dismissed) return null;

  const message = announcements[index] ?? announcements[0];

  return (
    <div className="bg-kc-ink text-kc-paper">
      <div className="relative mx-auto flex min-h-9 max-w-[1440px] items-center justify-center px-10 py-2">
        <p className="kc-eyebrow text-center" aria-live="polite">
          {message}
        </p>
        <button
          type="button"
          onClick={() => {
            setDismissed(true);
            try {
              window.sessionStorage.setItem(DISMISS_KEY, "1");
            } catch {
              // Nothing to remember it with; dismissing for this page is enough.
            }
          }}
          aria-label="Dismiss announcement"
          className="absolute right-1 flex h-9 w-9 items-center justify-center text-kc-paper/70 transition-colors hover:text-kc-paper"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
