/**
 * The single polite live region for the whole app (Section 15).
 * Mounted once in the root layout; fed by src/store/announcer.ts.
 */

import { useAnnouncement } from "@/store/announcer";

export function Announcer() {
  const { message, version } = useAnnouncement();

  return (
    <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
      {/* Keying on the version replaces the node, so an identical message
          announced twice is still read out the second time. */}
      <span key={version}>{message}</span>
    </div>
  );
}
