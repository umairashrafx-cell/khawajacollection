import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import PageContainer, { PageHeading } from "@/components/layout/PageContainer";
import ProductGrid, { ProductGridSkeleton } from "@/components/shop/ProductGrid";
import { listProducts } from "@/services/catalogService";

export const Route = createFileRoute("/search")({
  validateSearch: (search) => ({ q: typeof search.q === "string" ? search.q : "" }),
  head: () => ({
    meta: [
      { title: "Search — Khawaja Collection" },
      {
        name: "description",
        content: "Search the Khawaja Collection catalogue by piece, fabric or colour.",
      },
      { property: "og:title", content: "Search — Khawaja Collection" },
      {
        property: "og:description",
        content: "Search the Khawaja Collection catalogue by piece, fabric or colour.",
      },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "/search" }],
  }),
  component: SearchPage,
});

function SearchPage() {
  const { q } = Route.useSearch();
  const navigate = useNavigate();
  const [value, setValue] = useState(q);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => setValue(q), [q]);

  useEffect(() => {
    setLoading(true);
    listProducts({ query: q }).then((r) => {
      setRows(r);
      setLoading(false);
    });
  }, [q]);

  return (
    <PageContainer>
      <PageHeading eyebrow="Search" title={q ? `Results for “${q}”` : "Search the collection"} />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          navigate({ to: "/search", search: { q: value } });
        }}
        className="mb-10 flex max-w-lg gap-3"
      >
        <label htmlFor="search-input" className="sr-only">
          Search
        </label>
        <input
          id="search-input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Lawn, kurta, dupatta…"
          className="flex-1 border border-border px-4 py-3 text-sm outline-none focus:border-gold"
        />
        <button className="bg-foreground px-6 text-[11px] uppercase tracking-[0.2em] text-background">
          Search
        </button>
      </form>
      {loading ? <ProductGridSkeleton count={4} /> : <ProductGrid products={rows} />}
    </PageContainer>
  );
}
