/**
 * In-memory Category and Collection repositories.
 * See docs/BUILD-SPEC.pdf Sections 8.1 and 8.3 (the `categories` and
 * `collections` tables Phase 8 replaces these with).
 */

import { categories } from "@/data/categories";
import { collections } from "@/data/collections";
import type { Category, Collection } from "@/types";
import type { CategoryNode, CategoryRepository, CollectionRepository } from "../product-repository";

export class MockCategoryRepository implements CategoryRepository {
  async list(): Promise<Category[]> {
    return categories;
  }

  async tree(): Promise<CategoryNode[]> {
    const bySort = (a: Category, b: Category) => a.sortOrder - b.sortOrder;
    return categories
      .filter((c) => c.parentSlug == null)
      .sort(bySort)
      .map((parent) => ({
        ...parent,
        children: categories.filter((c) => c.parentSlug === parent.slug).sort(bySort),
      }));
  }

  async getBySlug(slug: string): Promise<Category | null> {
    return categories.find((c) => c.slug === slug) ?? null;
  }

  /** `/women/unstitched` → the category whose slug is `women-unstitched`. */
  async getSubcategory(parentSlug: string, segment: string): Promise<Category | null> {
    const slug = `${parentSlug}-${segment}`;
    const found = categories.find((c) => c.slug === slug && c.parentSlug === parentSlug);
    return found ?? null;
  }
}

export class MockCollectionRepository implements CollectionRepository {
  async list(): Promise<Collection[]> {
    return collections.filter((c) => c.isActive);
  }

  async getBySlug(slug: string): Promise<Collection | null> {
    return collections.find((c) => c.slug === slug && c.isActive) ?? null;
  }
}
