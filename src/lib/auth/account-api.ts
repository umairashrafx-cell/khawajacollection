/**
 * Calling our own account endpoints with the caller's access token.
 *
 * One place, because the failure that matters is silent: a fetch that forgets
 * the Authorization header does not crash, it returns 401 and the page renders
 * "no orders yet" to someone who has ten. Routing every account request
 * through here means the header cannot be forgotten in one component and
 * remembered in another.
 */

import { accessToken } from "./session-store";
import type { OrderStatus, OrderTotals, ShippingAddress } from "@/types";

export interface OrderSummary {
  orderNumber: string;
  status: OrderStatus;
  createdAt: string;
  total: number;
  itemCount: number;
  firstItemName: string;
}

export interface OrderDetail {
  orderNumber: string;
  status: OrderStatus;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  shipping: ShippingAddress;
  totals: OrderTotals;
  items: {
    name: string;
    slug: string;
    size: string;
    colorName: string;
    quantity: number;
    unitPrice: number;
  }[];
}

class NotSignedIn extends Error {
  constructor() {
    super("Sign in to see your orders.");
  }
}

async function getJson<T>(url: string): Promise<T> {
  const token = accessToken();
  // Refusing here rather than sending an anonymous request keeps the 401 that
  // React Query would otherwise retry out of the network entirely.
  if (!token) throw new NotSignedIn();

  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? "That did not work.");
  }
  return (await response.json()) as T;
}

export async function fetchOrders(): Promise<OrderSummary[]> {
  const body = await getJson<{ orders: OrderSummary[] }>("/api/account/orders");
  return body.orders;
}

export async function fetchOrder(orderNumber: string): Promise<OrderDetail> {
  const body = await getJson<{ order: OrderDetail }>(
    `/api/account/orders?number=${encodeURIComponent(orderNumber)}`,
  );
  return body.order;
}
