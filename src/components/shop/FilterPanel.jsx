const GROUPS = [
  { key: "sizes", label: "Size" },
  { key: "colours", label: "Colour" },
  { key: "fabrics", label: "Fabric" },
];

export default function FilterPanel({ facets, filters, onToggle, onPrice, onClear }) {
  return (
    <div className="space-y-8">
      {GROUPS.map((g) => (
        <fieldset key={g.key}>
          <legend className="mb-3 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            {g.label}
          </legend>
          <div className="flex flex-wrap gap-2">
            {(facets[g.key] || []).map((value) => {
              const active = filters[g.key].includes(value);
              return (
                <button
                  key={value}
                  onClick={() => onToggle(g.key, value)}
                  aria-pressed={active}
                  className={`border px-3 py-1.5 text-xs transition-colors ${
                    active
                      ? "border-foreground bg-foreground text-background"
                      : "border-border hover:border-gold"
                  }`}
                >
                  {value}
                </button>
              );
            })}
          </div>
        </fieldset>
      ))}

      <fieldset>
        <legend className="mb-3 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          Max price
        </legend>
        <input
          type="range"
          min={3000}
          max={30000}
          step={500}
          value={filters.maxPrice ?? 30000}
          onChange={(e) => onPrice(Number(e.target.value))}
          className="w-full accent-[var(--gold)]"
          aria-label="Maximum price"
        />
        <p className="mt-2 text-xs text-muted-foreground">
          Up to PKR {(filters.maxPrice ?? 30000).toLocaleString("en-PK")}
        </p>
      </fieldset>

      <button onClick={onClear} className="text-xs uppercase tracking-[0.2em] underline">
        Clear all
      </button>
    </div>
  );
}
