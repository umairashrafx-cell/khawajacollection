// Data access layer. Every screen reads the catalogue through these functions,
// so swapping the mock arrays for a real database or admin API is a one-file change.
import { products } from "@/data/legacy/products";
import { categories } from "@/data/legacy/categories";

const delay = (ms = 220) => new Promise((r) => setTimeout(r, ms));

export async function listCategories() {
  await delay(80);
  return categories;
}

export function findCategory(slug) {
  for (const c of categories) {
    if (c.slug === slug) return { ...c, isParent: true };
    const child = c.children.find((s) => s.slug === slug);
    if (child) return { ...child, isParent: false, parent: c };
  }
  return null;
}

function matchesCategory(product, slug) {
  if (!slug || slug === "all") return true;
  if (slug === "sale") return product.tags.includes("sale");
  return product.category === slug || product.subCategory === slug;
}

export async function listProducts({
  category,
  sizes = [],
  colours = [],
  fabrics = [],
  minPrice,
  maxPrice,
  sort = "featured",
  query = "",
} = {}) {
  await delay();
  const q = query.trim().toLowerCase();
  let rows = products.filter((p) => {
    if (!matchesCategory(p, category)) return false;
    if (sizes.length && !p.sizes.some((s) => sizes.includes(s.label))) return false;
    if (colours.length && !colours.includes(p.colour)) return false;
    if (fabrics.length && !fabrics.includes(p.fabric)) return false;
    if (minPrice != null && p.price < minPrice) return false;
    if (maxPrice != null && p.price > maxPrice) return false;
    if (q && !`${p.name} ${p.fabric} ${p.colour} ${p.category}`.toLowerCase().includes(q))
      return false;
    return true;
  });

  const sorters = {
    "price-asc": (a, b) => a.price - b.price,
    "price-desc": (a, b) => b.price - a.price,
    newest: (a, b) => Number(b.tags.includes("new")) - Number(a.tags.includes("new")),
    rating: (a, b) => b.rating - a.rating,
  };
  if (sorters[sort]) rows = [...rows].sort(sorters[sort]);
  return rows;
}

export async function getProduct(slug) {
  await delay(160);
  return products.find((p) => p.slug === slug) ?? null;
}

export async function getRelated(product, limit = 4) {
  await delay(120);
  return products
    .filter((p) => p.id !== product.id && p.category === product.category)
    .slice(0, limit);
}

export async function searchSuggestions(query) {
  const q = query.trim().toLowerCase();
  if (!q) return { products: [], categories: [] };
  await delay(120);
  return {
    products: products.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 5),
    categories: categories
      .flatMap((c) => [{ slug: c.slug, name: c.name }, ...c.children])
      .filter((c) => c.name.toLowerCase().includes(q))
      .slice(0, 4),
  };
}

export function facetsFor(rows) {
  const uniq = (arr) => [...new Set(arr)].sort();
  return {
    sizes: uniq(rows.flatMap((p) => p.sizes.map((s) => s.label))),
    colours: uniq(rows.map((p) => p.colour)),
    fabrics: uniq(rows.map((p) => p.fabric)),
  };
}

export function byTag(tag, limit = 8) {
  return products.filter((p) => p.tags.includes(tag)).slice(0, limit);
}

export function allProducts() {
  return products;
}
