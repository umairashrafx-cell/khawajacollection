/**
 * Search modal. See docs/BUILD-SPEC.pdf Sections 10.2 and 11.6.
 *
 * "Command-palette style. Opens on click or the `/` key. Debounced 200ms.
 * Sections: recent, popular, categories, products (max 6 with thumbnails)."
 *
 * Recent searches live in localStorage, capped at 6 (Section 11.6). Popular
 * searches come from config. Suggestions come from /api/search so the
 * catalogue never ships to the browser.
 *
 * Dynamically imported by the root layout, per the Phase 6 requirement.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Clock, Search, X } from "lucide-react";

import { AppLink } from "@/components/layout/AppLink";
import { Image } from "@/components/media/Image";
import { popularSearches } from "@/config/filters";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { formatPKR } from "@/lib/format";
import { closeOverlay, useIsOverlayOpen } from "@/store/ui-store";
import type { SearchSuggestions } from "@/routes/api/search";

const DEBOUNCE_MS = 200;
const RECENT_KEY = "kc-recent-searches-v1";
const MAX_RECENT = 6;

function readRecent(): string[] {
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter((v): v is string => typeof v === "string").slice(0, MAX_RECENT)
      : [];
  } catch {
    return [];
  }
}

function rememberSearch(term: string) {
  try {
    const next = [term, ...readRecent().filter((t) => t !== term)].slice(0, MAX_RECENT);
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // Nothing to remember it with; searching still works.
  }
}

const EMPTY: SearchSuggestions = { products: [], categories: [], total: 0 };

export default function SearchModal() {
  const open = useIsOverlayOpen("search");
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchSuggestions>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const close = useCallback(() => closeOverlay(), []);
  const panelRef = useFocusTrap<HTMLDivElement>(open, close);
  useBodyScrollLock(open);

  useEffect(() => {
    if (!open) return;
    setRecent(readRecent());
    // The trap focuses the first focusable element; for a search palette that
    // should be the field itself.
    const timer = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults(EMPTY);
    }
  }, [open]);

  // Debounced 200ms, with the in-flight request aborted when the term moves on
  // so a slow response cannot overwrite a newer one.
  useEffect(() => {
    const term = query.trim();
    if (term.length === 0) {
      setResults(EMPTY);
      setLoading(false);
      return;
    }

    setLoading(true);
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(term)}`, {
          signal: controller.signal,
        });
        setResults((await response.json()) as SearchSuggestions);
      } catch {
        // Aborted or offline — leave the previous results on screen.
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const submit = useCallback(
    (term: string) => {
      const trimmed = term.trim();
      if (!trimmed) return;
      rememberSearch(trimmed);
      close();
      void navigate({ to: "/search", search: { q: trimmed } as never });
    },
    [close, navigate],
  );

  if (!open) return null;

  const showSuggestions = query.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close search"
        onClick={close}
        className="absolute inset-0 bg-kc-ink/40"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Search products"
        tabIndex={-1}
        className="absolute inset-x-0 top-0 mx-auto flex max-h-[85vh] w-full max-w-2xl flex-col bg-kc-paper sm:mt-16 sm:rounded-lg"
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            submit(query);
          }}
          className="flex shrink-0 items-center gap-3 border-b border-kc-line px-4"
        >
          <Search className="h-4 w-4 shrink-0 text-kc-muted" aria-hidden="true" />
          <label htmlFor="site-search" className="sr-only">
            Search products
          </label>
          <input
            id="site-search"
            ref={inputRef}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search for lawn, kurta, bridal…"
            autoComplete="off"
            className="min-h-14 flex-1 bg-transparent text-sm text-kc-ink outline-none placeholder:text-kc-muted"
          />
          <button
            type="button"
            onClick={close}
            aria-label="Close search"
            className="-mr-2 flex h-11 w-11 shrink-0 items-center justify-center text-kc-muted"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </form>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          {!showSuggestions ? (
            <>
              {recent.length > 0 ? (
                <Group title="Recent searches">
                  <TermList terms={recent} icon={Clock} onPick={submit} />
                </Group>
              ) : null}
              <Group title="Popular searches">
                <TermList terms={[...popularSearches]} icon={Search} onPick={submit} />
              </Group>
            </>
          ) : (
            <>
              {results.categories.length > 0 ? (
                <Group title="Categories">
                  <ul className="space-y-1">
                    {results.categories.map((category) => (
                      <li key={category.href}>
                        <AppLink
                          href={category.href}
                          onClick={close}
                          className="flex min-h-11 items-center text-sm text-kc-ink hover:underline"
                        >
                          {category.label}
                        </AppLink>
                      </li>
                    ))}
                  </ul>
                </Group>
              ) : null}

              <Group title="Products">
                {results.products.length === 0 ? (
                  <p className="py-3 text-sm text-kc-charcoal" aria-live="polite">
                    {loading ? "Searching…" : `Nothing matches “${query.trim()}”.`}
                  </p>
                ) : (
                  <>
                    <ul className="space-y-2">
                      {results.products.map((product) => (
                        <li key={product.slug}>
                          <AppLink
                            href={`/products/${product.slug}`}
                            onClick={close}
                            className="flex items-center gap-3 py-1.5"
                          >
                            <span className="block w-12 shrink-0 bg-kc-sand">
                              <Image
                                src={product.image}
                                alt={product.alt}
                                width={900}
                                height={1200}
                                sizes="48px"
                                className="aspect-[3/4] w-full object-cover"
                              />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm text-kc-ink">
                                {product.name}
                              </span>
                              <span className="kc-price block text-xs text-kc-charcoal">
                                {formatPKR(product.price)}
                              </span>
                            </span>
                          </AppLink>
                        </li>
                      ))}
                    </ul>

                    {results.total > results.products.length ? (
                      <button
                        type="button"
                        onClick={() => submit(query)}
                        className="mt-3 min-h-11 w-full border border-kc-ink text-[12px] font-medium uppercase tracking-[0.08em] text-kc-ink"
                      >
                        See all {results.total} results
                      </button>
                    ) : null}
                  </>
                )}
              </Group>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-5 last:mb-0">
      <h3 className="kc-eyebrow mb-2 text-kc-muted">{title}</h3>
      {children}
    </section>
  );
}

function TermList({
  terms,
  icon: Icon,
  onPick,
}: {
  terms: string[];
  icon: typeof Search;
  onPick: (term: string) => void;
}) {
  return (
    <ul className="space-y-1">
      {terms.map((term) => (
        <li key={term}>
          <button
            type="button"
            onClick={() => onPick(term)}
            className="flex min-h-11 w-full items-center gap-2.5 text-left text-sm text-kc-ink"
          >
            <Icon className="h-3.5 w-3.5 shrink-0 text-kc-muted" aria-hidden="true" />
            {term}
          </button>
        </li>
      ))}
    </ul>
  );
}
