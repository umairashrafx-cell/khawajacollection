import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { SlidersHorizontal, X } from "lucide-react";
import PageContainer, { PageHeading } from "@/components/layout/PageContainer";
import ProductGrid, { ProductGridSkeleton } from "@/components/shop/ProductGrid";
import FilterPanel from "@/components/shop/FilterPanel";
import { findCategory, listProducts, facetsFor, allProducts } from "@/services/catalogService";

export const Route = createFileRoute("/category/$slug")({
  head: ({ params }) => {
    const cat = findCategory(params.slug);
    const name = cat?.name ?? "Shop";
    const title = `${name} — Khawaja Collection`;
    const description = `Shop ${name.toLowerCase()} at Khawaja Collection: premium Pakistani fashion with filters for size, colour, fabric and price.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: `/category/${params.slug}` },
      ],
      links: [{ rel: "canonical", href: `/category/${params.slug}` }],
    };
  },
  component: CategoryPage,
});

const SORTS = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "rating", label: "Top rated" },
];

const EMPTY = { sizes: [], colours: [], fabrics: [], maxPrice: null };

function CategoryPage() {
  const { slug } = Route.useParams();
  const category = findCategory(slug);
  const [filters, setFilters] = useState(EMPTY);
  const [sort, setSort] = useState("featured");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [panelOpen, setPanelOpen] = useState(false);

  useEffect(() => setFilters(EMPTY), [slug]);

  useEffect(() => {
    let live = true;
    setLoading(true);
    listProducts({ category: slug, ...filters, sort }).then((r) => {
      if (live) {
        setRows(r);
        setLoading(false);
      }
    });
    return () => {
      live = false;
    };
  }, [slug, filters, sort]);

  const facets = useMemo(() => facetsFor(allProducts()), []);

  const toggle = (key, value) =>
    setFilters((f) => ({
      ...f,
      [key]: f[key].includes(value) ? f[key].filter((v) => v !== value) : [...f[key], value],
    }));

  const panel = (
    <FilterPanel
      facets={facets}
      filters={filters}
      onToggle={toggle}
      onPrice={(maxPrice) => setFilters((f) => ({ ...f, maxPrice }))}
      onClear={() => setFilters(EMPTY)}
    />
  );

  return (
    <PageContainer>
      <nav aria-label="Breadcrumb" className="pt-6 text-xs text-muted-foreground">
        <Link to="/">Home</Link> <span className="mx-2">/</span>
        <span className="text-foreground">{category?.name ?? slug}</span>
      </nav>

      <PageHeading
        eyebrow="Collection"
        title={category?.name ?? "Shop"}
        description={category?.tagline}
      />

      <div className="flex items-center justify-between border-y border-border py-3">
        <button
          onClick={() => setPanelOpen(true)}
          className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] lg:hidden"
        >
          <SlidersHorizontal className="h-4 w-4" /> Filter
        </button>
        <p className="hidden text-xs text-muted-foreground lg:block">{rows.length} pieces</p>
        <label className="flex items-center gap-2 text-xs uppercase tracking-[0.18em]">
          <span className="sr-only sm:not-sr-only">Sort</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="bg-transparent py-1 text-xs outline-none"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-10 py-10 lg:grid-cols-[220px_1fr]">
        <aside className="hidden lg:block">{panel}</aside>
        <div>{loading ? <ProductGridSkeleton /> : <ProductGrid products={rows} columns={3} />}</div>
      </div>

      <div className={`fixed inset-0 z-50 lg:hidden ${panelOpen ? "" : "pointer-events-none"}`}>
        <div
          className={`absolute inset-0 bg-foreground/40 transition-opacity ${panelOpen ? "opacity-100" : "opacity-0"}`}
          onClick={() => setPanelOpen(false)}
        />
        <div
          className={`absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto rounded-t-xl bg-background p-6 transition-transform duration-300 ${panelOpen ? "translate-y-0" : "translate-y-full"}`}
        >
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-sm uppercase tracking-[0.2em]">Filter</h2>
            <button onClick={() => setPanelOpen(false)} aria-label="Close filters">
              <X className="h-5 w-5" />
            </button>
          </div>
          {panel}
          <button
            onClick={() => setPanelOpen(false)}
            className="mt-8 w-full bg-foreground py-3 text-[11px] uppercase tracking-[0.2em] text-background"
          >
            Show {rows.length} pieces
          </button>
        </div>
      </div>
    </PageContainer>
  );
}
