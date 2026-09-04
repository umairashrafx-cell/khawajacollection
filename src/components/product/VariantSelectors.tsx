/**
 * Colour, size and quantity controls. See docs/BUILD-SPEC.pdf Sections 10.2,
 * 11.3 and 15.
 *
 * Sizes are pills, never a dropdown, and an unavailable size stays visible,
 * struck through and disabled. Colour swatches always carry their name in text
 * — colour alone must never be the only way to tell variants apart (Section 15).
 */

import { Minus, Plus } from "lucide-react";

import type { ColorOption, SizeOption } from "@/lib/product-variants";

export function ColorSelector({
  colors,
  selected,
  onSelect,
}: {
  colors: ColorOption[];
  selected: string | null;
  onSelect: (name: string) => void;
}) {
  if (colors.length === 0) return null;

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <h2 className="kc-eyebrow text-kc-muted">Colour</h2>
        <p className="text-sm text-kc-charcoal">{selected}</p>
      </div>
      <ul className="mt-3 flex flex-wrap gap-2.5">
        {colors.map((color) => (
          <li key={color.name}>
            <button
              type="button"
              onClick={() => onSelect(color.name)}
              aria-pressed={selected === color.name}
              aria-label={color.hasStock ? color.name : `${color.name}, out of stock`}
              className={`flex h-11 w-11 items-center justify-center border transition-colors ${
                selected === color.name
                  ? "border-kc-ink"
                  : "border-kc-line hover:border-kc-charcoal"
              }`}
            >
              <span
                className={`h-6 w-6 border border-kc-line ${color.hasStock ? "" : "opacity-40"}`}
                style={{ backgroundColor: color.hex }}
                aria-hidden="true"
              />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SizeSelector({
  sizes,
  selected,
  onSelect,
  onOpenGuide,
}: {
  sizes: SizeOption[];
  selected: string | null;
  onSelect: (size: string) => void;
  onOpenGuide: () => void;
}) {
  if (sizes.length === 0) return null;

  // A single-size product (unstitched cloth, one-size accessories) has nothing
  // to choose, so it reads as a statement rather than a control.
  if (sizes.length === 1) {
    const only = sizes[0];
    return (
      <div>
        <h2 className="kc-eyebrow text-kc-muted">Size</h2>
        <p className="mt-2 text-sm text-kc-charcoal">{only?.size}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <h2 className="kc-eyebrow text-kc-muted">Size</h2>
        <button
          type="button"
          onClick={onOpenGuide}
          className="inline-flex min-h-11 items-center text-xs text-kc-charcoal underline underline-offset-4 hover:text-kc-ink lg:min-h-0"
        >
          Size Guide
        </button>
      </div>
      <ul className="mt-3 flex flex-wrap gap-2">
        {sizes.map((option) => (
          <li key={option.size}>
            <button
              type="button"
              disabled={!option.inStock}
              onClick={() => onSelect(option.size)}
              aria-pressed={selected === option.size}
              aria-label={
                option.inStock ? `Size ${option.size}` : `Size ${option.size}, out of stock`
              }
              className={[
                "min-h-11 min-w-12 border px-3 text-sm font-medium transition-colors",
                selected === option.size
                  ? "border-kc-ink bg-kc-ink text-kc-paper"
                  : "border-kc-line text-kc-ink",
                option.inStock
                  ? "hover:border-kc-ink"
                  : "cursor-not-allowed text-kc-muted line-through",
              ].join(" ")}
            >
              {option.size}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function QuantityStepper({
  value,
  max,
  onChange,
}: {
  value: number;
  max: number;
  onChange: (next: number) => void;
}) {
  const ceiling = Math.max(1, Math.min(max, 10));

  return (
    <div>
      <h2 className="kc-eyebrow text-kc-muted">Quantity</h2>
      <div className="mt-3 flex w-fit items-center border border-kc-line">
        <button
          type="button"
          onClick={() => onChange(Math.max(1, value - 1))}
          disabled={value <= 1}
          aria-label="Decrease quantity"
          className="flex h-11 w-11 items-center justify-center text-kc-ink disabled:text-kc-muted"
        >
          <Minus className="h-4 w-4" aria-hidden="true" />
        </button>
        <span className="kc-price min-w-10 text-center text-sm" aria-live="polite">
          {value}
          <span className="sr-only"> in bag</span>
        </span>
        <button
          type="button"
          onClick={() => onChange(Math.min(ceiling, value + 1))}
          disabled={value >= ceiling}
          aria-label="Increase quantity"
          className="flex h-11 w-11 items-center justify-center text-kc-ink disabled:text-kc-muted"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
