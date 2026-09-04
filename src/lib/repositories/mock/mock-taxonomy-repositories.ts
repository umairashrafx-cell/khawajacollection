/**
 * In-memory Category and Collection repositories.
 * See docs/BUILD-SPEC.pdf Sections 8.1 and 8.3 (the `categories` and
 * `collections` tables Phase 8 replaces these with).
 */

import { categories } from "@/data/categories";
import { collections } from "@/data/collections";
import type { Category, Collection } from "@/types";
import type {
  CategoryInput,
  CategoryNode,
  CategoryRepository,
  CollectionRepository,
} from "../product-repository";

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

  /**
   * Writes into the imported array. Same caveat as every other mock write:
   * it holds for one process and is invisible to the next isolate, so a
   * category created on a mock deployment is gone on the next cold start.
   * It exists because Phase 8 item 6 requires the mock to remain a valid way
   * to run the whole site, and an admin whose Save does nothing is not that.
   */
  async saveCategory(input: CategoryInput): Promise<Category> {
    const category: Category = {
      slug: input.slug,
      name: input.name,
      ...(input.description ? { description: input.description } : {}),
      ...(input.parentSlug ? { parentSlug: input.parentSlug } : {}),
      ...(input.imageUrl
        ? { image: { url: input.imageUrl, alt: input.name, width: 960, height: 1200 } }
        : {}),
      sortOrder: input.sortOrder,
    };

    if (input.parentSlug && !categories.some((c) => c.slug === input.parentSlug)) {
      throw new Error("That parent category does not exist.");
    }

    const at = categories.findIndex((c) => c.slug === input.slug);
    if (at >= 0) categories[at] = category;
    else categories.push(category);

    return category;
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
