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
import { MockOrderRepository } from "./mock/mock-order-repository";
import { MockProductRepository } from "./mock/mock-product-repository";
import type {
  CategoryRepository,
  CollectionRepository,
  ProductRepository,
} from "./product-repository";
import type { OrderRepository } from "./order-repository";

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
/**
 * ⚠ In-memory until Phase 8 — see mock-order-repository.ts. Orders do not
 * survive a server restart, and on serverless they very likely do not survive
 * the next request either.
 */
export const orderRepository: OrderRepository = new MockOrderRepository();

export type {
  CategoryNode,
  CategoryRepository,
  CollectionRepository,
  ProductListResult,
  ProductQuery,
  ProductRepository,
} from "./product-repository";
export type { CreateOrderInput, OrderRepository } from "./order-repository";
