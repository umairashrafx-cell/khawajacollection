/**
 * The order seam. Same pattern as ProductRepository (Section 8.2): the routes
 * talk to this interface, and Phase 8 swaps in a Supabase implementation
 * against the `orders` and `order_items` tables from Section 8.3.
 *
 * Lookup is deliberately narrow. Section 11.6: guest tracking is "a
 * server-side lookup by order number + phone", and Section 8.3 forbids ever
 * exposing a way for an anonymous caller to read all orders. So there is no
 * open `list()` here — only lookups that already require either both halves of
 * the guest pair, or a user id.
 *
 * `listForUser` and `findForUser` take a user id rather than a token on
 * purpose: resolving a token to a user is authentication, it belongs in the
 * API route, and a repository that accepted tokens would invite a caller to
 * skip that step. Every call site must have verified the token server-side
 * first. A user id reaching here is a claim that has already been checked.
 */

import type { Order, OrderDraft, OrderItem, OrderTotals } from "@/types";

export interface CreateOrderInput {
  draft: OrderDraft;
  /** Priced server-side from the repository, never from the client. */
  items: OrderItem[];
  totals: OrderTotals;
  /**
   * Set when the buyer was signed in, so the order shows up in their history.
   * Guest checkout stays supported and leaves this undefined.
   */
  userId?: string;
}

export interface OrderRepository {
  create(input: CreateOrderInput): Promise<Order>;
  /** Guest tracking: both the order number and a matching contact are required. */
  findForTracking(orderNumber: string, contact: string): Promise<Order | null>;
  /** Account history. The caller must already have verified the user id. */
  listForUser(userId: string): Promise<Order[]>;
  /** One order, scoped to its owner so an order number alone reveals nothing. */
  findForUser(userId: string, orderNumber: string): Promise<Order | null>;
}
