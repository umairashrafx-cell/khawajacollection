import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Search, X } from "lucide-react";
import { searchSuggestions } from "@/services/catalogService";
import { useShop } from "@/context/ShopContext";
import { formatPrice } from "@/lib/format";

const popular = ["Lawn", "Formals", "Kurta", "Dupatta", "Sale"];

export default function SearchOverlay() {
  const { searchOpen, setSearchOpen } = useShop();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState({ products: [], categories: [] });
  const navigate = useNavigate();

  useEffect(() => {
    if (!searchOpen) return;
    const t = setTimeout(() => {
      searchSuggestions(query).then(setResults);
    }, 180);
    return () => clearTimeout(t);
  }, [query, searchOpen]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setSearchOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setSearchOpen]);

  if (!searchOpen) return null;

  const submit = (e) => {
    e.preventDefault();
    setSearchOpen(false);
    navigate({ to: "/search", search: { q: query } });
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/98 animate-in fade-in duration-200">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <form onSubmit={submit} className="flex items-center gap-3 border-b border-foreground pb-3">
          <Search className="h-5 w-5 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for lawn, formals, kurta…"
            aria-label="Search products"
            className="w-full bg-transparent text-base outline-none placeholder:text-muted-foreground"
          />
          <button type="button" aria-label="Close search" onClick={() => setSearchOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </form>

        {!query && (
          <div className="mt-6">
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Popular</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {popular.map((p) => (
                <button
                  key={p}
                  onClick={() => setQuery(p)}
                  className="rounded-full border border-border px-4 py-1.5 text-sm hover:border-gold"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {results.categories.length > 0 && (
          <ul className="mt-6 space-y-2">
            {results.categories.map((c) => (
              <li key={c.slug + c.name}>
                <Link
                  to="/category/$slug"
                  params={{ slug: c.slug }}
                  onClick={() => setSearchOpen(false)}
                  className="text-sm text-muted-foreground hover:text-gold"
                >
                  in {c.name}
                </Link>
              </li>
            ))}
          </ul>
        )}

        <ul className="mt-6 space-y-3">
          {results.products.map((p) => (
            <li key={p.id}>
              <Link
                to="/product/$slug"
                params={{ slug: p.slug }}
                onClick={() => setSearchOpen(false)}
                className="flex items-center gap-4"
              >
                <img src={p.images[0]} alt="" loading="lazy" className="h-16 w-12 object-cover" />
                <span className="text-sm">{p.name}</span>
                <span className="ml-auto text-sm text-muted-foreground">
                  {formatPrice(p.price)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
