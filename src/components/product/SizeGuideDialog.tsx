/**
 * Size guide dialog. See docs/BUILD-SPEC.pdf Phase 5 and Section 15.
 *
 * Modal, so it traps focus, closes on Escape and restores focus on the way out.
 * The table itself is a real <table> with scope-d headers, which is what makes
 * it navigable by a screen reader rather than a grid of loose numbers.
 */

import { X } from "lucide-react";

import {
  howToMeasure,
  mensSizes,
  sizeGuideNote,
  womensSizes,
  type SizeRow,
} from "@/config/size-guide";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { useFocusTrap } from "@/hooks/useFocusTrap";

export function SizeGuideDialog({
  open,
  onClose,
  categorySlug,
}: {
  open: boolean;
  onClose: () => void;
  categorySlug: string;
}) {
  const panelRef = useFocusTrap<HTMLDivElement>(open, onClose);
  useBodyScrollLock(open);

  if (!open) return null;

  const mens = categorySlug === "men";
  const rows = mens ? mensSizes : womensSizes;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Close size guide"
        onClick={onClose}
        className="absolute inset-0 bg-kc-ink/40"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="size-guide-title"
        tabIndex={-1}
        className="relative max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-lg bg-kc-paper p-6 sm:rounded-lg"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="size-guide-title" className="font-display text-xl">
            {mens ? "Men's size guide" : "Women's size guide"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close size guide"
            className="-mr-2 -mt-2 flex h-11 w-11 shrink-0 items-center justify-center"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <SizeTable rows={rows} />

        <h3 className="mt-6 kc-eyebrow text-kc-muted">How to measure</h3>
        <ul className="mt-3 space-y-1.5 text-sm text-kc-charcoal">
          {howToMeasure.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>

        <p className="mt-6 border-t border-kc-line pt-4 text-xs text-kc-muted">{sizeGuideNote}</p>
      </div>
    </div>
  );
}

export function SizeTable({ rows }: { rows: SizeRow[] }) {
  return (
    <div className="mt-5 overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <caption className="sr-only">Size measurements in inches</caption>
        <thead>
          <tr className="border-b border-kc-line text-left">
            <th scope="col" className="py-2 pr-4 font-medium">
              Size
            </th>
            <th scope="col" className="py-2 pr-4 font-medium">
              Chest (in)
            </th>
            <th scope="col" className="py-2 pr-4 font-medium">
              Waist (in)
            </th>
            <th scope="col" className="py-2 font-medium">
              Hip (in)
            </th>
          </tr>
        </thead>
        <tbody className="kc-price">
          {rows.map((row) => (
            <tr key={row.size} className="border-b border-kc-line last:border-0">
              <th scope="row" className="py-2 pr-4 text-left font-medium">
                {row.size}
              </th>
              <td className="py-2 pr-4">{row.chest}</td>
              <td className="py-2 pr-4">{row.waist}</td>
              <td className="py-2">{row.hip}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
