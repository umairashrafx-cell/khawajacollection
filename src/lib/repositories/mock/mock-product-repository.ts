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
import type {
  ProductInput,
  ProductListResult,
  ProductQuery,
  ProductRepository,
} from "../product-repository";

/** Slug to display name, for search matching and facet labels. */
const NAMES = new Map<string, string>([
  ...categories.map((category) => [category.slug, category.name] as [string, string]),
  ...collections.map((collection) => [collection.slug, collection.name] as [string, string]),
]);

const BY_ID = new Map(products.map((product) => [product.id, product]));

/** A fresh id for a variant the admin just added. */
function newVariantId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `var-${Date.now()}-${Math.random()}`;
}

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

  /**
   * Create or replace in the in-memory catalogue. Same caveat as every other
   * write here: it holds for one process and is invisible to the next isolate.
   * It exists because Phase 8 item 6 requires the mock to stay a valid way to
   * run the whole site, and an admin that cannot save is not that.
   */
  async saveProduct(input: ProductInput, id?: string): Promise<Product> {
    const existing = id ? BY_ID.get(id) : undefined;

    // Postgres enforces this with a unique index on products.slug, and the two
    // implementations have to refuse the same things for the same reasons —
    // otherwise a product that saves under `mock` fails under `supabase` with
    // a message nobody has seen before. Same wording as the Supabase one.
    const clash = products.find(
      (candidate) => candidate.slug === input.slug && candidate.id !== existing?.id,
    );
    if (clash) {
      throw new Error(`The web address "${input.slug}" is already used by another product.`);
    }

    const product: Product = {
      id: existing?.id ?? `kc-${Date.now().toString(36)}`,
      slug: input.slug,
      name: input.name,
      description: input.description,
      shortDescription: input.shortDescription,
      price: input.price,
      ...(input.salePrice !== null ? { salePrice: input.salePrice } : {}),
      categorySlug: input.categorySlug,
      ...(input.subcategorySlug ? { subcategorySlug: input.subcategorySlug } : {}),
      collectionSlugs: existing?.collectionSlugs ?? [],
      images: input.images.map((image, index) => ({
        url: image.url,
        alt: image.alt,
        width: 900,
        height: 1200,
        ...(index === 0 ? { isPrimary: true } : {}),
      })),
      variants: input.variants.map((variant) => ({
        id: variant.id ?? newVariantId(),
        sku: variant.sku,
        size: variant.size,
        colorName: variant.colorName,
        colorHex: variant.colorHex,
        stock: Math.max(0, Math.trunc(variant.stock)),
      })),
      ...(input.fabric ? { fabric: input.fabric } : {}),
      ...(input.pieces !== null ? { pieces: input.pieces } : {}),
      ...(input.care ? { care: input.care } : {}),
      tags: input.tags,
      rating: existing?.rating ?? 0,
      reviewCount: existing?.reviewCount ?? 0,
      isFeatured: input.isFeatured,
      isNewArrival: input.isNewArrival,
      isBestSeller: existing?.isBestSeller ?? false,
      isOnSale: input.salePrice !== null,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
      ...(input.isMadeToOrder ? { isMadeToOrder: true } : {}),
    };

    const at = products.findIndex((candidate) => candidate.id === product.id);
    if (at >= 0) products[at] = product;
    else products.push(product);
    BY_ID.set(product.id, product);

    return product;
  }

  /**
   * Single-threaded JavaScript, so the read and the write below cannot
   * interleave the way two Postgres sessions can. The in-memory caveat that
   * applies to every other write here applies to this one too.
   */
  async reserveStock(variantId: string, quantity: number): Promise<number | null> {
    if (!Number.isInteger(quantity) || quantity <= 0) return null;

    for (const product of products) {
      const variant = product.variants.find((candidate) => candidate.id === variantId);
      if (!variant) continue;
      if (variant.stock < quantity) return null;
      variant.stock -= quantity;
      return variant.stock;
    }
    return null;
  }

  async releaseStock(variantId: string, quantity: number): Promise<void> {
    if (!Number.isInteger(quantity) || quantity <= 0) return;

    for (const product of products) {
      const variant = product.variants.find((candidate) => candidate.id === variantId);
      if (variant) {
        variant.stock += quantity;
        return;
      }
    }
  }
}
