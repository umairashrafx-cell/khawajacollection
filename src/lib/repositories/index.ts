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
import { SupabaseOrderRepository } from "./supabase/supabase-order-repository";
import { SupabaseProductRepository } from "./supabase/supabase-product-repository";
import type {
  CategoryRepository,
  CollectionRepository,
  ProductRepository,
} from "./product-repository";
import type { OrderRepository } from "./order-repository";

/**
 * Phase 8 item 6 — flip the implementation with an env var, and keep BOTH
 * valid. The mock is not dead code: it is what makes the app runnable with no
 * database at all, and every page must keep working under it.
 */
const implementation = import.meta.env["VITE_PRODUCT_REPOSITORY"] ?? "mock";

if (implementation !== "mock" && implementation !== "supabase") {
  // Failing loudly beats silently serving mock data from a deployment that
  // believes it is live.
  throw new Error(
    `VITE_PRODUCT_REPOSITORY="${implementation}" is not a known repository. ` +
      `Use "mock" or "supabase".`,
  );
}

export const productRepository: ProductRepository =
  implementation === "supabase" ? new SupabaseProductRepository() : new MockProductRepository();
export const categoryRepository: CategoryRepository = new MockCategoryRepository();
export const collectionRepository: CollectionRepository = new MockCollectionRepository();
/**
 * Orders follow the same flag as the catalogue, and for a stronger reason: on
 * "supabase" they are rows in Postgres and survive a redeploy, while on
 * "mock" they live in a module-level Map that does not survive the next cold
 * isolate. A deployment that reads its catalogue from Postgres but writes its
 * orders to memory would be the worst of both, so one flag decides both.
 *
 * ⚠ UNDER "mock", ORDERS ARE STILL IN MEMORY. Do not take real orders on a
 * mock deployment — see mock-order-repository.ts.
 */
export const orderRepository: OrderRepository =
  implementation === "supabase" ? new SupabaseOrderRepository() : new MockOrderRepository();

export type {
  CategoryNode,
  CategoryRepository,
  CollectionRepository,
  ProductListResult,
  ProductQuery,
  ProductRepository,
} from "./product-repository";
export type { CreateOrderInput, OrderRepository } from "./order-repository";
