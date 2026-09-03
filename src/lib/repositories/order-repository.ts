/**
 * The order seam. Same pattern as ProductRepository (Section 8.2): the routes
 * talk to this interface, and Phase 8 swaps in a Supabase implementation
 * against the `orders` and `order_items` tables from Section 8.3.
 *
 * Lookup is deliberately narrow. Section 11.6: guest tracking is "a
 * server-side lookup by order number + phone", and Section 8.3 forbids ever
 * exposing a way for an anonymous caller to read all orders. So there is no
 * `list()` here — only a lookup that already requires knowing both halves.
 */

import type { Order, OrderDraft, OrderItem, OrderTotals } from "@/types";

export interface CreateOrderInput {
  draft: OrderDraft;
  /** Priced server-side from the repository, never from the client. */
  items: OrderItem[];
  totals: OrderTotals;
}

export interface OrderRepository {
  create(input: CreateOrderInput): Promise<Order>;
  /** Guest tracking: both the order number and a matching contact are required. */
  findForTracking(orderNumber: string, contact: string): Promise<Order | null>;
}
