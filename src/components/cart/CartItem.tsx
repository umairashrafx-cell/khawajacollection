/**
 * One cart line. See docs/BUILD-SPEC.pdf Section 11.4.
 *
 * "3:4 thumbnail, name (links to PDP), size, colour, quantity stepper, line
 * total, remove, save-for-later." Removing offers a five-second undo.
 */

import { toast } from "sonner";
import { Minus, Plus, X } from "lucide-react";

import { AppLink } from "@/components/layout/AppLink";
import { Image } from "@/components/media/Image";
import { formatPKR } from "@/lib/format";
import { announce } from "@/store/announcer";
import { lineKey, removeLine, restoreLine, setQuantity } from "@/store/cart-store";
import type { CartLine } from "@/types";

export function CartItem({ line, compact = false }: { line: CartLine; compact?: boolean }) {
  const key = lineKey(line.productId, line.variantId);
  const lineTotal = line.unitPrice * line.quantity;

  function remove() {
    const removed = removeLine(key);
    if (!removed) return;
    announce(`${line.name} removed from your bag.`);
    // Section 11.4 — a five-second undo, because a mis-tap on a phone should
    // not cost someone the item they were about to buy.
    toast(`${line.name} removed`, {
      duration: 5000,
      action: {
        label: "Undo",
        onClick: () => {
          restoreLine(removed.line, removed.index);
          announce(`${line.name} put back in your bag.`);
        },
      },
    });
  }

  return (
    <article className="flex gap-4">
      <AppLink
        href={`/products/${line.slug}`}
        className={`block shrink-0 bg-kc-sand ${compact ? "w-20" : "w-24 md:w-28"}`}
      >
        <Image
          src={line.image}
          alt={line.name}
          width={900}
          height={1200}
          sizes={compact ? "80px" : "112px"}
          className="aspect-[3/4] w-full object-cover"
        />
      </AppLink>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <AppLink
              href={`/products/${line.slug}`}
              className="line-clamp-2 text-[13px] leading-snug text-kc-ink hover:underline md:text-sm"
            >
              {line.name}
            </AppLink>
            <p className="mt-1 text-xs text-kc-muted">
              {line.colorName}
              {line.size ? ` · ${line.size}` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={remove}
            aria-label={`Remove ${line.name} from bag`}
            className="-mr-2 -mt-2 flex h-11 w-11 shrink-0 items-center justify-center text-kc-muted hover:text-kc-ink"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="flex items-center border border-kc-line">
            <button
              type="button"
              onClick={() => setQuantity(key, line.quantity - 1)}
              aria-label={`Decrease quantity of ${line.name}`}
              className="flex h-10 w-10 items-center justify-center text-kc-ink"
            >
              <Minus className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
            <span className="kc-price min-w-8 text-center text-sm">{line.quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity(key, line.quantity + 1)}
              aria-label={`Increase quantity of ${line.name}`}
              className="flex h-10 w-10 items-center justify-center text-kc-ink"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>

          <p className="kc-price text-sm font-semibold">{formatPKR(lineTotal)}</p>
        </div>
      </div>
    </article>
  );
}
