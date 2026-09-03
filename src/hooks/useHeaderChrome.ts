/**
 * Header scroll behaviour. See docs/BUILD-SPEC.pdf Section 10.2.
 *
 *   solid   — the header goes from transparent to solid past 80px
 *   hidden  — it hides on scroll down and reveals on scroll up
 *
 * `hidden` is reported at every width; the Header only applies it below `lg`,
 * because hide-on-scroll is a mobile behaviour and CSS is the cheaper place to
 * draw that line than a media-query listener.
 *
 * The handler reads scroll position synchronously rather than deferring to
 * requestAnimationFrame. The work is two comparisons, the browser already
 * throttles scroll events to the frame rate, and rAF can stall — a restored
 * background tab, an embedded webview — which would leave the header stuck
 * off-screen with no way to recover.
 */

import { useEffect, useState } from "react";

/** Section 10.2 — solid on scroll past 80px. */
const SOLID_AT = 80;
/** Ignore jitter; only a deliberate scroll should move the header. */
const DIRECTION_THRESHOLD = 8;

export interface HeaderChrome {
  solid: boolean;
  hidden: boolean;
}

export function useHeaderChrome(): HeaderChrome {
  // Both start false so the server and the first client render agree.
  const [chrome, setChrome] = useState<HeaderChrome>({ solid: false, hidden: false });

  useEffect(() => {
    let lastY = window.scrollY;

    const read = () => {
      const y = window.scrollY;
      const delta = y - lastY;

      setChrome((previous) => {
        const solid = y > SOLID_AT;
        let hidden = previous.hidden;

        if (Math.abs(delta) >= DIRECTION_THRESHOLD) {
          // Never hide the header before it has even gone solid, or the page
          // top loses its navigation on the smallest downward flick.
          hidden = delta > 0 && y > SOLID_AT;
        }
        if (y <= SOLID_AT) hidden = false;

        return solid === previous.solid && hidden === previous.hidden
          ? previous
          : { solid, hidden };
      });

      lastY = y;
    };

    read();
    window.addEventListener("scroll", read, { passive: true });
    return () => window.removeEventListener("scroll", read);
  }, []);

  return chrome;
}
