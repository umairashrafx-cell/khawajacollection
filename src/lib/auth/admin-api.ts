/**
 * Calling the admin endpoints with the caller's access token.
 *
 * Same shape as account-api.ts and for the same reason: a fetch that forgets
 * the Authorization header does not crash, it returns 403 and the screen shows
 * an empty order book to someone who has fifty orders. One place to get it
 * right.
 */

import { accessToken } from "./session-store";
import type { OrderStatus, OrderTotals, ShippingAddress } from "@/types";

export interface AdminOrderItem {
  name: string;
  slug: string;
  size: string;
  colorName: string;
  quantity: number;
  unitPrice: number;
}

export interface AdminOrder {
  orderNumber: string;
  status: OrderStatus;
  createdAt: string;
  paymentMethod: string;
  paymentStatus: string;
  email: string | null;
  phone: string;
  shipping: ShippingAddress;
  totals: OrderTotals;
  items: AdminOrderItem[];
}

export interface AdminOrderPage {
  orders: AdminOrder[];
  total: number;
  page: number;
  perPage: number;
  counts: Record<string, number>;
  revenue: number;
}

class NotSignedIn extends Error {
  constructor() {
    super("Sign in as an administrator.");
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const token = accessToken();
  if (!token) throw new NotSignedIn();

  const response = await fetch(url, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      Authorization: `Bearer ${token}`,
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
    },
  });

  const body = (await response.json().catch(() => ({}))) as { error?: string };
  if (!response.ok) throw new Error(body.error ?? "That did not work.");
  return body as T;
}

export function fetchAdminOrders(params: {
  status?: string | undefined;
  q?: string | undefined;
  page?: number | undefined;
}): Promise<AdminOrderPage> {
  const search = new URLSearchParams();
  if (params.status) search.set("status", params.status);
  if (params.q) search.set("q", params.q);
  if (params.page && params.page > 1) search.set("page", String(params.page));

  const qs = search.toString();
  return request<AdminOrderPage>(`/api/admin/orders${qs ? `?${qs}` : ""}`);
}

export async function fetchAdminOrder(orderNumber: string): Promise<AdminOrder> {
  const body = await request<{ order: AdminOrder }>(
    `/api/admin/orders?number=${encodeURIComponent(orderNumber)}`,
  );
  return body.order;
}

export async function updateOrderStatus(
  orderNumber: string,
  status: OrderStatus,
): Promise<AdminOrder> {
  const body = await request<{ order: AdminOrder }>("/api/admin/orders", {
    method: "POST",
    body: JSON.stringify({ orderNumber, status }),
  });
  return body.order;
}
