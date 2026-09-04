/**
 * In-memory ProductRepository backed by src/data/products.ts.
 * See docs/BUILD-SPEC.pdf Section 8.2 and Phase 1 item 2.
 *
 * The filtering, sorting and faceting live in ../shared/catalogue-query so
 * this and SupabaseProductRepository cannot disagree about what a facet count
 * means. This file is only "where the rows come from".
 *
 * Nothing here may leak into a component: import from
 * src/lib/repositories/index.ts instead.
 */

import { PER_PAGE } from "@/config/filters";
import { categories } from "@/data/categories";
import { collections } from "@/data/collections";
import { products } from "@/data/products";
import type { Product } from "@/types";
import { buildFacets, filterAndSort } from "../shared/catalogue-query";
import type { ProductListResult, ProductQuery, ProductRepository } from "../product-repository";

/** Slug to display name, for search matching and facet labels. */
const NAMES = new Map<string, string>([
  ...categories.map((category) => [category.slug, category.name] as [string, string]),
  ...collections.map((collection) => [collection.slug, collection.name] as [string, string]),
]);

const BY_ID = new Map(products.map((product) => [product.id, product]));

export class MockProductRepository implements ProductRepository {
  async list(query: ProductQuery): Promise<ProductListResult> {
    const sorted = filterAndSort(products, query, NAMES);

    const perPage = query.perPage ?? PER_PAGE;
    const page = Math.max(1, query.page ?? 1);
    const start = (page - 1) * perPage;

    return {
      items: sorted.slice(start, start + perPage),
      total: sorted.length,
      facets: buildFacets(products, query, NAMES),
    };
  }

  async getBySlug(slug: string): Promise<Product | null> {
    return products.find((product) => product.slug === slug) ?? null;
  }

  async getById(id: string): Promise<Product | null> {
    return BY_ID.get(id) ?? null;
  }

  async getAllSlugs(): Promise<string[]> {
    return products.map((product) => product.slug);
  }

  /** Nearest first: same subcategory, then same category, then anything else. */
  async related(product: Product, limit: number): Promise<Product[]> {
    const score = (candidate: Product) => {
      if (candidate.subcategorySlug === product.subcategorySlug) return 0;
      if (candidate.categorySlug === product.categorySlug) return 1;
      if (candidate.collectionSlugs.some((slug) => product.collectionSlugs.includes(slug))) {
        return 2;
      }
      return 3;
    };
    return products
      .filter((candidate) => candidate.id !== product.id)
      .sort((a, b) => score(a) - score(b) || b.reviewCount - a.reviewCount)
      .slice(0, limit);
  }

  /**
   * Mutates the in-memory catalogue. Same caveat as MockOrderRepository: it
   * holds for the life of one process and is invisible to the next isolate,
   * which is fine for local development and useless in production. Under
   * `supabase` this is a real UPDATE.
   */
  async updateVariantStock(variantId: string, stock: number): Promise<Product | null> {
    for (const product of products) {
      const variant = product.variants.find((candidate) => candidate.id === variantId);
      if (variant) {
        variant.stock = Math.max(0, Math.trunc(stock));
        return product;
      }
    }
    return null;
  }
}
