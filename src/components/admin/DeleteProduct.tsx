/**
 * The danger zone on a product's edit page.
 *
 * WHY IT ASKS YOU TO TYPE THE NAME. A confirm dialog is a reflex, not a
 * decision — people dismiss them without reading, and a mis-click on a phone
 * is exactly how a product disappears at 2am. Typing the name cannot be done
 * by accident, and it makes you look at which product you are on. The server
 * checks the same string, so this is a usability device on top of a real
 * guard rather than the guard itself.
 *
 * WHY IT IS COLLAPSED. It sits below Save, behind a link, in the last section
 * of a long form. Nothing about the layout should put deletion within easy
 * reach of the thing you came to do.
 *
 * IT SAYS WHAT WILL AND WILL NOT HAPPEN, because "are you sure?" answers the
 * wrong question. What people actually want to know is whether it breaks
 * anything, and the honest answer here is specific: past orders are safe
 * (order_items snapshots the sale and holds no foreign key), the photographs
 * go, and the URL starts returning 404.
 */

import { useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";

export function DeleteProduct({
  name,
  deleting,
  error,
  onDelete,
}: {
  name: string;
  deleting: boolean;
  error: string | null;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");

  const matches = typed.trim() === name;

  if (!open) {
    return (
      <div className="border border-kc-line bg-kc-white p-4 sm:p-5">
        <h2 className="font-display text-lg text-kc-ink">Delete this product</h2>
        <p className="mt-2 max-w-prose text-sm text-kc-charcoal">
          Taking it off the shop is almost always the better choice — untick{" "}
          <strong className="font-medium text-kc-ink">Published</strong> above and it disappears
          from the shop while staying here, editable. Deleting is permanent.
        </p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-3 flex min-h-11 items-center gap-2 text-sm text-kc-sale underline underline-offset-4"
        >
          I want to delete it anyway
        </button>
      </div>
    );
  }

  return (
    <div className="border border-kc-sale bg-kc-white p-4 sm:p-5">
      <h2 className="flex items-center gap-2 font-display text-lg text-kc-sale">
        <AlertTriangle className="h-5 w-5" aria-hidden="true" />
        Delete {name}
      </h2>

      <div className="mt-3 max-w-prose space-y-2 text-sm text-kc-charcoal">
        <p>This cannot be undone. When you delete it:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Its photographs are removed from storage.</li>
          <li>Its sizes, stock and any wishlist entries go with it.</li>
          <li>
            Its web address starts returning “not found”, so any link to it — including one already
            in Google — breaks.
          </li>
          <li>
            <strong className="font-medium text-kc-ink">Past orders are not affected.</strong> An
            order stores the name, size, colour and price as they were on the day, so it still reads
            correctly afterwards.
          </li>
        </ul>
      </div>

      <label className="mt-4 block">
        <span className="block text-xs uppercase tracking-[0.12em] text-kc-charcoal">
          Type the product’s name to confirm
        </span>
        <span className="mt-0.5 block text-xs text-kc-muted">{name}</span>
        <input
          type="text"
          value={typed}
          onChange={(event) => setTyped(event.target.value)}
          autoComplete="off"
          className="mt-1.5 min-h-11 w-full max-w-md border border-kc-line bg-kc-white px-3 text-sm text-kc-ink"
        />
      </label>

      {error ? (
        <p role="alert" className="mt-3 border border-kc-sale bg-kc-white p-3 text-sm text-kc-sale">
          {error}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onDelete}
          disabled={!matches || deleting}
          className="flex min-h-11 items-center gap-2 bg-kc-sale px-5 text-sm tracking-wide text-kc-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          {deleting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
          Delete permanently
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setTyped("");
          }}
          className="min-h-11 border border-kc-line px-4 text-sm text-kc-ink"
        >
          Keep it
        </button>
      </div>
    </div>
  );
}
