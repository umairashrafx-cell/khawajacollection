/**
 * In-memory orders for Phases 7 only.
 *
 * ⚠ THIS IS NOT PRODUCTION STORAGE, AND THE SITE MUST NOT TAKE REAL ORDERS
 * UNTIL PHASE 8 REPLACES IT.
 *
 * Orders live in a module-level Map. That survives for the life of one server
 * process, which is fine for local development and useless in production: on
 * Vercel or Cloudflare each request may hit a different isolate, so an order
 * placed in one invocation is very likely invisible to the tracking lookup in
 * the next. There is nothing to fix here — the spec puts durable storage in
 * Phase 8 (Section 8.3), and this exists so Phase 7 can build and verify the
 * checkout flow against a real seam rather than a placeholder.
 *
 * Phase 8 replaces this file with SupabaseOrderRepository and nothing else
 * changes.
 */

import { formatOrderNumber, normalizePakistaniPhone } from "@/lib/format";
import type { Order } from "@/types";
import type { CreateOrderInput, OrderRepository } from "../order-repository";

const orders = new Map<string, Order>();
/** Order number -> owning user id, for the account history seam. */
const owners = new Map<string, string>();
let sequence = 0;

function randomId(): string {
  // crypto.randomUUID exists in every runtime this app targets.
  return globalThis.crypto?.randomUUID?.() ?? `ord_${Date.now()}_${sequence}`;
}

/** Case- and space-insensitive, because people retype these off a screenshot. */
function normalise(value: string): string {
  return value.replace(/\s+/g, "").toLowerCase();
}

export class MockOrderRepository implements OrderRepository {
  async create(input: CreateOrderInput): Promise<Order> {
    sequence += 1;
    const now = new Date();

    const order: Order = {
      id: randomId(),
      orderNumber: formatOrderNumber(sequence, now.getFullYear()),
      ...(input.draft.email ? { email: input.draft.email } : {}),
      phone: input.draft.phone,
      shipping: input.draft.shipping,
      items: input.items,
      totals: input.totals,
      paymentMethod: input.draft.paymentMethod,
      // COD is collected by the courier, so nothing is paid at this point.
      paymentStatus: "pending",
      status: "placed",
      createdAt: now.toISOString(),
    };

    orders.set(normalise(order.orderNumber), order);
    if (input.userId) owners.set(normalise(order.orderNumber), input.userId);
    return order;
  }

  async findForTracking(orderNumber: string, contact: string): Promise<Order | null> {
    const order = orders.get(normalise(orderNumber));
    if (!order) return null;

    // Knowing the order number alone is not enough to read someone's address.
    //
    // The stored phone is normalised to +92 (Section 16), but a customer
    // tracking an order types it however they think of it — almost always the
    // 03xx form they entered at checkout. Comparing raw strings there fails
    // for the single most likely input, so the contact is put through the same
    // normaliser before it is compared.
    const asPhone = normalizePakistaniPhone(contact);
    const matches =
      (asPhone !== null && asPhone === order.phone) ||
      (order.email !== undefined && normalise(order.email) === normalise(contact));

    return matches ? order : null;
  }

  /**
   * Account history. Same in-memory caveat as everything else in this file:
   * it answers correctly within one process and finds nothing across two.
   */
  async listForUser(userId: string): Promise<Order[]> {
    return [...orders.entries()]
      .filter(([key]) => owners.get(key) === userId)
      .map(([, order]) => order)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async findForUser(userId: string, orderNumber: string): Promise<Order | null> {
    const key = normalise(orderNumber);
    // Scoped by owner, so an order number alone reveals nothing.
    if (owners.get(key) !== userId) return null;
    return orders.get(key) ?? null;
  }
}
