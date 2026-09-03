/**
 * Recently viewed products. See docs/BUILD-SPEC.pdf Sections 11.3 and 12.
 *
 * localStorage under `kc-recent-v1`, capped at 12, current product excluded.
 *
 * DEVIATION, deliberate. Section 12 says "capped at 12 slugs". Slugs alone are
 * not renderable: the rail would need either the whole catalogue shipped to the
 * browser or a round trip before it could draw anything, and it sits below the
 * fold where neither is worth it. So each entry stores a four-field snapshot —
 * slug, name, image, price — which is exactly what the rail draws. The cap is
 * still 12 and the key is still one list.
 *
 * A snapshot can go stale if a price changes between visits. That is acceptable
 * here because nothing is bought from this rail: it links to the PDP, which
 * always reads live data, and Section 12 already requires prices to be
 * recomputed server-side at checkout.
 */

import { useEffect, useState } from "react";

import { resolvePrice } from "@/lib/format";
import type { Product } from "@/types";

const STORAGE_KEY = "kc-recent-v1";
const MAX_ENTRIES = 12;

export interface RecentEntry {
  slug: string;
  name: string;
  image: string;
  alt: string;
  price: number;
}

function read(): RecentEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isEntry).slice(0, MAX_ENTRIES);
  } catch {
    return [];
  }
}

function isEntry(value: unknown): value is RecentEntry {
  if (typeof value !== "object" || value === null) return false;
  const entry = value as Record<string, unknown>;
  return (
    typeof entry["slug"] === "string" &&
    typeof entry["name"] === "string" &&
    typeof entry["image"] === "string" &&
    typeof entry["price"] === "number"
  );
}

function toEntry(product: Product): RecentEntry {
  const image = product.images[0];
  return {
    slug: product.slug,
    name: product.name,
    image: image?.url ?? "",
    alt: image?.alt ?? product.name,
    price: resolvePrice(product),
  };
}

/**
 * Records `current` as viewed and returns everything viewed before it.
 *
 * Returns an empty list on the server and on the first client render, so the
 * markup matches and the rail simply appears once storage has been read
 * (Section 12: no SSR mismatch).
 */
export function useRecentlyViewed(current: Product): RecentEntry[] {
  const [others, setOthers] = useState<RecentEntry[]>([]);

  useEffect(() => {
    const previous = read();
    setOthers(previous.filter((entry) => entry.slug !== current.slug));

    const next = [toEntry(current), ...previous.filter((e) => e.slug !== current.slug)].slice(
      0,
      MAX_ENTRIES,
    );
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Private mode or a full quota — the rail is a convenience, not a feature
      // worth failing a page render over.
    }
  }, [current]);

  return others;
}
