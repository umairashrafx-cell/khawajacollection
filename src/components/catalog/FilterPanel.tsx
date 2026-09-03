/**
 * The filter controls. See docs/BUILD-SPEC.pdf Sections 10.2 and 11.2.
 *
 * "FilterSidebar / FilterDrawer — same state, two presentations." This is that
 * shared state, and the state is the URL: both presentations render this panel,
 * so there is nothing to keep in sync.
 *
 * Every count comes from the repository facets, computed with that facet's own
 * filter excluded, so the number beside "L" is what picking L would actually
 * give (Section 11.2: "Facet counts must be real").
 */

import { Check } from "lucide-react";

import { colors as COLOR_TOKENS, discountBands } from "@/config/filters";
import { usePlpNavigate, usePlpSearch } from "@/hooks/usePlpSearch";
import { formatPKR } from "@/lib/format";
import {
  parseList,
  withToggledValue,
  withValue,
  type ListKey,
  type PlpSearch,
} from "@/lib/plp-search";
import type { FacetValue, Facets } from "@/types";

const COLOR_HEX = new Map<string, string>(COLOR_TOKENS.map((c) => [c.value, c.hex]));

export interface FilterPanelProps {
  facets: Facets;
  /** Groups the route owns and the shopper must not override. */
  lockedGroups?: ("subcategory" | "collection")[];
  onNavigated?: () => void;
}

export function FilterPanel({ facets, lockedGroups = [], onNavigated }: FilterPanelProps) {
  const search = usePlpSearch();
  const navigate = usePlpNavigate();

  const go = (next: PlpSearch) => {
    navigate(next);
    onNavigated?.();
  };

  const locked = new Set(lockedGroups);

  return (
    <div className="divide-y divide-kc-line">
      {!locked.has("subcategory") && facets.subcategories.length > 1 ? (
        <Group title="Category">
          <ul className="space-y-1">
            {facets.subcategories.map((facet) => (
              <li key={facet.value}>
                <Radio
                  name="subcategory"
                  label={facet.label}
                  count={facet.count}
                  checked={search.subcategory === facet.value}
                  onChange={() =>
                    go(
                      withValue(
                        search,
                        "subcategory",
                        search.subcategory === facet.value ? undefined : facet.value,
                      ),
                    )
                  }
                />
              </li>
            ))}
          </ul>
        </Group>
      ) : null}

      {facets.sizes.length > 0 ? (
        <Group title="Size">
          <div className="flex flex-wrap gap-2">
            {facets.sizes.map((facet) => (
              <SizePill
                key={facet.value}
                facet={facet}
                selected={parseList(search.size).includes(facet.value)}
                onClick={() => go(withToggledValue(search, "size", facet.value))}
              />
            ))}
          </div>
        </Group>
      ) : null}

      {facets.colors.length > 0 ? (
        <Group title="Colour">
          <ul className="space-y-1.5">
            {facets.colors.map((facet) => (
              <li key={facet.value}>
                <Checkbox
                  label={facet.label}
                  count={facet.count}
                  checked={parseList(search.color).includes(facet.value)}
                  onChange={() => go(withToggledValue(search, "color", facet.value))}
                  {...(COLOR_HEX.has(facet.value)
                    ? { swatch: COLOR_HEX.get(facet.value) as string }
                    : {})}
                />
              </li>
            ))}
          </ul>
        </Group>
      ) : null}

      {facets.fabrics.length > 0 ? (
        <Group title="Fabric">
          <ul className="space-y-1.5">
            {facets.fabrics.map((facet) => (
              <li key={facet.value}>
                <Checkbox
                  label={facet.label}
                  count={facet.count}
                  checked={parseList(search.fabric).includes(facet.value)}
                  onChange={() => go(withToggledValue(search, "fabric", facet.value))}
                />
              </li>
            ))}
          </ul>
        </Group>
      ) : null}

      {facets.pieces.length > 0 ? (
        <Group title="Pieces">
          <ul className="space-y-1.5">
            {facets.pieces.map((facet) => (
              <li key={facet.value}>
                <Checkbox
                  label={facet.label}
                  count={facet.count}
                  checked={parseList(search.pieces).includes(facet.value)}
                  onChange={() => go(withToggledValue(search, "pieces", facet.value))}
                />
              </li>
            ))}
          </ul>
        </Group>
      ) : null}

      <PriceGroup search={search} range={facets.priceRange} onApply={go} />

      {!locked.has("collection") && facets.collections.length > 0 ? (
        <Group title="Collection">
          <ul className="space-y-1">
            {facets.collections.map((facet) => (
              <li key={facet.value}>
                <Radio
                  name="collection"
                  label={facet.label}
                  count={facet.count}
                  checked={search.collection === facet.value}
                  onChange={() =>
                    go(
                      withValue(
                        search,
                        "collection",
                        search.collection === facet.value ? undefined : facet.value,
                      ),
                    )
                  }
                />
              </li>
            ))}
          </ul>
        </Group>
      ) : null}

      <Group title="Availability">
        <Checkbox
          label="In stock only"
          checked={search.inStock === true}
          onChange={() => go(withValue(search, "inStock", search.inStock ? undefined : true))}
        />
      </Group>

      <Group title="Discount">
        <ul className="space-y-1">
          {discountBands.map((band) => (
            <li key={band.value}>
              <Radio
                name="discount"
                label={band.label}
                checked={search.discount === band.value}
                onChange={() =>
                  go(
                    withValue(
                      search,
                      "discount",
                      search.discount === band.value ? undefined : band.value,
                    ),
                  )
                }
              />
            </li>
          ))}
        </ul>
      </Group>
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="py-5 first:pt-0">
      <h3 className="kc-eyebrow mb-3 text-kc-muted">{title}</h3>
      {children}
    </section>
  );
}

/**
 * Section 10.2 — pills, not a dropdown. A size with no results is struck
 * through and disabled rather than hidden, so the run reads XS–XXL every time.
 */
function SizePill({
  facet,
  selected,
  onClick,
}: {
  facet: FacetValue;
  selected: boolean;
  onClick: () => void;
}) {
  const unavailable = facet.count === 0;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={unavailable}
      aria-pressed={selected}
      className={[
        "min-h-11 min-w-11 border px-3 text-xs font-medium transition-colors",
        selected ? "border-kc-ink bg-kc-ink text-kc-paper" : "border-kc-line text-kc-ink",
        unavailable ? "cursor-not-allowed text-kc-muted line-through" : "hover:border-kc-ink",
      ].join(" ")}
    >
      {facet.label}
      <span className="sr-only">, {facet.count} products</span>
    </button>
  );
}

function Checkbox({
  label,
  count,
  checked,
  onChange,
  swatch,
}: {
  label: string;
  count?: number;
  checked: boolean;
  onChange: () => void;
  swatch?: string;
}) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-2.5 text-sm">
      <span
        className={`flex h-4 w-4 shrink-0 items-center justify-center border ${
          checked ? "border-kc-ink bg-kc-ink" : "border-kc-line bg-kc-white"
        }`}
      >
        {checked ? <Check className="h-3 w-3 text-kc-paper" aria-hidden="true" /> : null}
      </span>
      <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
      {swatch ? (
        // Section 15 — a swatch never carries meaning alone; the name is
        // always visible beside it.
        <span
          className="h-4 w-4 shrink-0 border border-kc-line"
          style={{ backgroundColor: swatch }}
          aria-hidden="true"
        />
      ) : null}
      <span className="text-kc-ink">{label}</span>
      {count !== undefined ? <span className="text-kc-muted">({count})</span> : null}
    </label>
  );
}

function Radio({
  name,
  label,
  count,
  checked,
  onChange,
}: {
  name: string;
  label: string;
  count?: number;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-2.5 text-sm">
      <span
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
          checked ? "border-kc-ink" : "border-kc-line bg-kc-white"
        }`}
      >
        {checked ? <span className="h-2 w-2 rounded-full bg-kc-ink" aria-hidden="true" /> : null}
      </span>
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onChange}
        // Clicking the selected option clears it, which a radio cannot do on
        // its own.
        onClick={() => (checked ? onChange() : undefined)}
        className="sr-only"
      />
      <span className="text-kc-ink">{label}</span>
      {count !== undefined ? <span className="text-kc-muted">({count})</span> : null}
    </label>
  );
}

function PriceGroup({
  search,
  range,
  onApply,
}: {
  search: PlpSearch;
  range: { min: number; max: number };
  onApply: (next: PlpSearch) => void;
}) {
  return (
    <Group title="Price">
      <form
        className="flex items-end gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          const min = Number.parseInt(String(form.get("minPrice") ?? ""), 10);
          const max = Number.parseInt(String(form.get("maxPrice") ?? ""), 10);
          let next = withValue(search, "minPrice", Number.isFinite(min) ? min : undefined);
          next = withValue(next, "maxPrice", Number.isFinite(max) ? max : undefined);
          onApply(next);
        }}
      >
        <div className="flex-1">
          <label htmlFor="price-min" className="sr-only">
            Minimum price in rupees
          </label>
          <input
            id="price-min"
            name="minPrice"
            type="number"
            inputMode="numeric"
            min={0}
            defaultValue={search.minPrice ?? ""}
            placeholder={String(range.min)}
            className="min-h-11 w-full border border-kc-line bg-kc-white px-2 text-sm"
          />
        </div>
        <span className="pb-3 text-kc-muted">–</span>
        <div className="flex-1">
          <label htmlFor="price-max" className="sr-only">
            Maximum price in rupees
          </label>
          <input
            id="price-max"
            name="maxPrice"
            type="number"
            inputMode="numeric"
            min={0}
            defaultValue={search.maxPrice ?? ""}
            placeholder={String(range.max)}
            className="min-h-11 w-full border border-kc-line bg-kc-white px-2 text-sm"
          />
        </div>
        <button
          type="submit"
          className="min-h-11 bg-kc-ink px-3 text-[11px] font-medium uppercase tracking-[0.08em] text-kc-paper"
        >
          Go
        </button>
      </form>
      <p className="mt-2 text-xs text-kc-muted">
        {formatPKR(range.min)} – {formatPKR(range.max)} in this listing
      </p>
    </Group>
  );
}

export type { ListKey };
