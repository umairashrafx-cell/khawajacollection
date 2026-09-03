/**
 * The PLP URL contract. See docs/BUILD-SPEC.pdf Section 11.2.
 *
 * "All filter state lives in the URL" — filtered views must be shareable and
 * back-button safe, so this module is the single definition of how a filtered
 * listing is spelled:
 *
 *   /women?size=M,L&color=ivory&sort=price-asc&page=2
 *
 * List-valued params are stored as comma-joined STRINGS rather than arrays.
 * That is deliberate: TanStack's default search serialiser would JSON-encode a
 * real array into `size=%5B%22M%22%5D`, and the spec fixes the URL shape.
 * Arrays only exist on the way into a repository query.
 */

import { DEFAULT_SORT, PER_PAGE, sortOptions } from "@/config/filters";
import type { ProductQuery } from "@/lib/repositories";
import type { ProductSort } from "@/types";

/** Raw search params, exactly as they appear in the URL. */
export interface PlpSearch {
  size?: string;
  color?: string;
  fabric?: string;
  pieces?: string;
  collection?: string;
  subcategory?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  /** Minimum discount percent, e.g. 30 for "30% and above". */
  discount?: number;
  sort?: ProductSort;
  page?: number;
  q?: string;
}

/** Every list-valued filter key, for generic add/remove handling. */
export const LIST_KEYS = ["size", "color", "fabric", "pieces"] as const;
export type ListKey = (typeof LIST_KEYS)[number];

const SORT_VALUES = new Set<string>(sortOptions.map((option) => option.value));

function str(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function int(value: unknown): number | undefined {
  const parsed = typeof value === "number" ? value : Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function bool(value: unknown): boolean | undefined {
  if (value === true || value === "true") return true;
  return undefined;
}

/**
 * Route `validateSearch`. Unknown params are dropped and malformed values are
 * ignored rather than throwing — a hand-edited or stale URL should degrade to
 * a sane listing, not an error page.
 */
export function validatePlpSearch(input: Record<string, unknown>): PlpSearch {
  // Narrowed into locals first: TypeScript cannot see that two calls to the
  // same helper return the same value, so inline conditionals would leave
  // every field as `string | undefined`.
  const size = str(input["size"]);
  const color = str(input["color"]);
  const fabric = str(input["fabric"]);
  const pieces = str(input["pieces"]);
  const collection = str(input["collection"]);
  const subcategory = str(input["subcategory"]);
  const q = str(input["q"]);
  const sort = str(input["sort"]);
  const page = int(input["page"]);
  const minPrice = int(input["minPrice"]);
  const maxPrice = int(input["maxPrice"]);
  const discount = int(input["discount"]);

  return {
    ...(size ? { size } : {}),
    ...(color ? { color } : {}),
    ...(fabric ? { fabric } : {}),
    ...(pieces ? { pieces } : {}),
    ...(collection ? { collection } : {}),
    ...(subcategory ? { subcategory } : {}),
    ...(minPrice !== undefined && minPrice >= 0 ? { minPrice } : {}),
    ...(maxPrice !== undefined && maxPrice > 0 ? { maxPrice } : {}),
    ...(bool(input["inStock"]) ? { inStock: true } : {}),
    ...(discount !== undefined && discount > 0 ? { discount } : {}),
    ...(sort && SORT_VALUES.has(sort) ? { sort: sort as ProductSort } : {}),
    ...(page !== undefined && page > 1 ? { page } : {}),
    ...(q ? { q } : {}),
  };
}

/**
 * Serialises search state back into a query string, in a stable key order so
 * the same filters always produce the same URL (and the same cache key).
 */
export function buildSearchString(search: PlpSearch): string {
  const order: (keyof PlpSearch)[] = [
    "subcategory",
    "collection",
    "size",
    "color",
    "fabric",
    "pieces",
    "minPrice",
    "maxPrice",
    "inStock",
    "discount",
    "q",
    "sort",
    "page",
  ];

  const params = new URLSearchParams();
  for (const key of order) {
    const value = search[key];
    if (value === undefined) continue;
    params.set(key, String(value));
  }
  const query = params.toString();
  // Commas are legal in a query value and the spec's URLs use them literally,
  // so undo URLSearchParams' escaping of them.
  return query ? `?${query.replace(/%2C/g, ",")}` : "";
}

export function parseList(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

function joinList(values: string[]): string | undefined {
  return values.length > 0 ? values.join(",") : undefined;
}

/** Turns URL state plus a route's fixed query into a repository query. */
export function toProductQuery(search: PlpSearch, base: ProductQuery = {}): ProductQuery {
  const sizes = parseList(search.size);
  const colors = parseList(search.color);
  const fabrics = parseList(search.fabric);
  const pieces = parseList(search.pieces)
    .map((value) => Number.parseInt(value, 10))
    .filter((value) => Number.isFinite(value));

  return {
    ...base,
    ...(sizes.length ? { sizes } : {}),
    ...(colors.length ? { colors } : {}),
    ...(fabrics.length ? { fabrics } : {}),
    ...(pieces.length ? { pieces } : {}),
    // A route's own collection or subcategory always wins over the URL, so
    // /collections/summer-lawn cannot be filtered out of its own collection.
    ...(search.collection && !base.collection ? { collection: search.collection } : {}),
    ...(search.subcategory && !base.subcategory ? { subcategory: search.subcategory } : {}),
    ...(search.minPrice !== undefined ? { minPrice: search.minPrice } : {}),
    ...(search.maxPrice !== undefined ? { maxPrice: search.maxPrice } : {}),
    ...(search.inStock ? { inStockOnly: true } : {}),
    ...(search.discount !== undefined ? { minDiscount: search.discount } : {}),
    ...(search.q ? { q: search.q } : {}),
    sort: search.sort ?? base.sort ?? DEFAULT_SORT,
    page: search.page ?? 1,
    perPage: base.perPage ?? PER_PAGE,
  };
}

/**
 * Adds or removes one value from a list-valued filter, and resets to page 1 —
 * landing on page 4 of a freshly narrowed result set is never what was meant.
 */
export function withToggledValue(search: PlpSearch, key: ListKey, value: string): PlpSearch {
  const current = parseList(search[key]);
  const next = current.includes(value)
    ? current.filter((item) => item !== value)
    : [...current, value];

  const { page: _page, ...rest } = search;
  const joined = joinList(next);
  if (joined === undefined) {
    const { [key]: _dropped, ...withoutKey } = rest;
    return withoutKey;
  }
  return { ...rest, [key]: joined };
}

/** Sets or clears a single-valued filter, resetting pagination. */
export function withValue<K extends keyof PlpSearch>(
  search: PlpSearch,
  key: K,
  value: PlpSearch[K] | undefined,
): PlpSearch {
  const { page: _page, ...rest } = search;
  if (value === undefined) {
    const { [key]: _dropped, ...withoutKey } = rest;
    return withoutKey as PlpSearch;
  }
  return { ...rest, [key]: value };
}

/** Clear all — keeps the sort, drops every filter and the page. */
export function clearedSearch(search: PlpSearch): PlpSearch {
  return search.sort ? { sort: search.sort } : {};
}

export function hasActiveFilters(search: PlpSearch): boolean {
  const { sort: _sort, page: _page, ...filters } = search;
  return Object.keys(filters).length > 0;
}

export interface FilterChip {
  /** Stable key for React. */
  id: string;
  label: string;
  /** The search object this chip's remove button navigates to. */
  next: PlpSearch;
}

/**
 * The removable chips above the grid (Section 11.2). Labels come from the
 * facets so a chip reads "Ivory", not "ivory".
 */
export function describeActiveFilters(
  search: PlpSearch,
  labels: {
    color: (value: string) => string;
    fabric: (value: string) => string;
    collection: (value: string) => string;
    subcategory: (value: string) => string;
  },
  formatPrice: (value: number) => string,
): FilterChip[] {
  const chips: FilterChip[] = [];

  for (const value of parseList(search.size)) {
    chips.push({
      id: `size:${value}`,
      label: `Size ${value}`,
      next: withToggledValue(search, "size", value),
    });
  }
  for (const value of parseList(search.color)) {
    chips.push({
      id: `color:${value}`,
      label: labels.color(value),
      next: withToggledValue(search, "color", value),
    });
  }
  for (const value of parseList(search.fabric)) {
    chips.push({
      id: `fabric:${value}`,
      label: labels.fabric(value),
      next: withToggledValue(search, "fabric", value),
    });
  }
  for (const value of parseList(search.pieces)) {
    chips.push({
      id: `pieces:${value}`,
      label: `${value} Piece`,
      next: withToggledValue(search, "pieces", value),
    });
  }
  if (search.subcategory) {
    chips.push({
      id: "subcategory",
      label: labels.subcategory(search.subcategory),
      next: withValue(search, "subcategory", undefined),
    });
  }
  if (search.collection) {
    chips.push({
      id: "collection",
      label: labels.collection(search.collection),
      next: withValue(search, "collection", undefined),
    });
  }
  if (search.minPrice !== undefined || search.maxPrice !== undefined) {
    const from = search.minPrice !== undefined ? formatPrice(search.minPrice) : null;
    const to = search.maxPrice !== undefined ? formatPrice(search.maxPrice) : null;
    chips.push({
      id: "price",
      label: from && to ? `${from} – ${to}` : from ? `${from} and above` : `Up to ${to}`,
      next: withValue(withValue(search, "minPrice", undefined), "maxPrice", undefined),
    });
  }
  if (search.inStock) {
    chips.push({
      id: "inStock",
      label: "In stock only",
      next: withValue(search, "inStock", undefined),
    });
  }
  if (search.discount !== undefined) {
    chips.push({
      id: "discount",
      label: `${search.discount}% off or more`,
      next: withValue(search, "discount", undefined),
    });
  }
  if (search.q) {
    chips.push({
      id: "q",
      label: `“${search.q}”`,
      next: withValue(search, "q", undefined),
    });
  }

  return chips;
}
