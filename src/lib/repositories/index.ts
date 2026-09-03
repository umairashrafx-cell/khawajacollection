/**
 * The only data-access entry point. See docs/BUILD-SPEC.pdf Section 8.2.
 *
 * Components import from HERE and nowhere else — never from `src/data/*`,
 * never from a concrete repository. That is what makes Phase 8's swap to
 * Supabase a change to this file alone.
 *
 * Selected by VITE_PRODUCT_REPOSITORY: "mock" (default) or "supabase".
 */

import {
  MockCategoryRepository,
  MockCollectionRepository,
} from "./mock/mock-taxonomy-repositories";
import { MockProductRepository } from "./mock/mock-product-repository";
import type {
  CategoryRepository,
  CollectionRepository,
  ProductRepository,
} from "./product-repository";

const implementation = import.meta.env["VITE_PRODUCT_REPOSITORY"] ?? "mock";

if (implementation !== "mock") {
  // Phase 8 adds the Supabase implementations here. Failing loudly beats
  // silently serving mock data from a deployment that believes it is live.
  throw new Error(
    `VITE_PRODUCT_REPOSITORY="${implementation}" is not implemented yet. ` +
      `Only "mock" exists until Phase 8.`,
  );
}

export const productRepository: ProductRepository = new MockProductRepository();
export const categoryRepository: CategoryRepository = new MockCategoryRepository();
export const collectionRepository: CollectionRepository = new MockCollectionRepository();

export type {
  CategoryNode,
  CategoryRepository,
  CollectionRepository,
  ProductListResult,
  ProductQuery,
  ProductRepository,
} from "./product-repository";
