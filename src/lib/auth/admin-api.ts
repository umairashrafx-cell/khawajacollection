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

/* --- Stock ----------------------------------------------------------- */

export interface AdminVariant {
  id: string;
  sku: string;
  size: string;
  colorName: string;
  stock: number;
}

export interface AdminProduct {
  id: string;
  slug: string;
  name: string;
  price: number;
  categorySlug: string;
  totalStock: number;
  /** False when the piece has been taken off the shop but kept for editing. */
  isActive: boolean;
  variants: AdminVariant[];
}

export interface StockSummary {
  soldOutVariants: number;
  lowStockVariants: number;
  soldOutProducts: number;
  unpublishedProducts: number;
  totalVariants: number;
  lowStockThreshold: number;
}

export interface AdminProductPage {
  products: AdminProduct[];
  total: number;
  page: number;
  perPage: number;
  summary: StockSummary;
}

export function fetchAdminProducts(params: {
  q?: string | undefined;
  filter?: string | undefined;
  page?: number | undefined;
}): Promise<AdminProductPage> {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.filter) search.set("filter", params.filter);
  if (params.page && params.page > 1) search.set("page", String(params.page));

  const qs = search.toString();
  return request<AdminProductPage>(`/api/admin/products${qs ? `?${qs}` : ""}`);
}

export async function updateVariantStock(variantId: string, stock: number): Promise<AdminProduct> {
  const body = await request<{ product: AdminProduct }>("/api/admin/products", {
    method: "POST",
    body: JSON.stringify({ variantId, stock }),
  });
  return body.product;
}

/**
 * Downloads the order book as CSV.
 *
 * Fetched rather than linked, because the endpoint needs an Authorization
 * header and a plain <a href> cannot carry one. The blob URL is revoked
 * afterwards — without that, every export leaks a copy of the whole order
 * book into the tab's memory for as long as it stays open.
 */
export async function downloadOrdersCsv(params: {
  status?: string | undefined;
  q?: string | undefined;
}): Promise<void> {
  const token = accessToken();
  if (!token) throw new NotSignedIn();

  const search = new URLSearchParams({ format: "csv" });
  if (params.status) search.set("status", params.status);
  if (params.q) search.set("q", params.q);

  const response = await fetch(`/api/admin/orders?${search}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Export failed.");

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `kc-orders-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/* --- Access ---------------------------------------------------------- */

export interface AdminWhoami {
  isAdmin: boolean;
  email: string | null;
}

/**
 * Asks the SERVER whether this session is an admin, rather than reading the
 * role out of a token the browser has been holding since sign-in. See the
 * note in src/routes/api/admin/whoami.ts — a token issued before the role was
 * granted does not carry it, which made freshly-promoted admins look locked
 * out of a panel that would have served them.
 */
export async function fetchAdminAccess(): Promise<AdminWhoami> {
  const token = accessToken();
  if (!token) return { isAdmin: false, email: null };

  const response = await fetch("/api/admin/whoami", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) return { isAdmin: false, email: null };

  const body = (await response.json()) as AdminWhoami;
  return { isAdmin: body.isAdmin === true, email: body.email ?? null };
}

/* --- Product editing -------------------------------------------------- */

export interface AdminCategory {
  slug: string;
  name: string;
  parentSlug?: string;
  children?: { slug: string; name: string }[];
}

/**
 * The form's own shape. Deliberately all-strings for the number fields: an
 * <input type="number"> gives you "" while someone is retyping a price, and
 * storing that as 0 would show a free kurta for as long as the field is empty.
 * The strings are converted once, on the server, where a bad one can be
 * refused with a sentence.
 */
export interface ProductFormValues {
  id?: string;
  slug: string;
  name: string;
  description: string;
  shortDescription: string;
  price: string;
  salePrice: string;
  categorySlug: string;
  subcategorySlug: string;
  fabric: string;
  pieces: string;
  care: string;
  tags: string;
  isFeatured: boolean;
  isNewArrival: boolean;
  isMadeToOrder: boolean;
  isActive: boolean;
  images: { url: string; alt: string }[];
  variants: {
    id?: string;
    sku: string;
    size: string;
    colorName: string;
    colorHex: string;
    stock: string;
  }[];
}

export interface ProductFormData {
  categories: AdminCategory[];
  product?: {
    id: string;
    slug: string;
    name: string;
    description: string;
    shortDescription: string;
    price: number;
    salePrice?: number;
    categorySlug: string;
    subcategorySlug?: string;
    fabric?: string;
    pieces?: number;
    care?: string;
    tags: string[];
    isFeatured: boolean;
    isNewArrival: boolean;
    isMadeToOrder?: boolean;
    /** Absent means published; see Product.isActive. */
    isActive?: boolean;
    images: { url: string; alt: string }[];
    variants: {
      id: string;
      sku: string;
      size: string;
      colorName: string;
      colorHex: string;
      stock: number;
    }[];
  };
}

export function fetchProductForm(id?: string): Promise<ProductFormData> {
  return request<ProductFormData>(`/api/admin/product${id ? `?id=${encodeURIComponent(id)}` : ""}`);
}

export async function saveProduct(
  values: ProductFormValues,
): Promise<{ slug: string; id: string }> {
  const body = await request<{ product: { slug: string; id: string } }>("/api/admin/product", {
    method: "POST",
    body: JSON.stringify({
      ...values,
      tags: values.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    }),
  });
  return body.product;
}

/* --- Categories -------------------------------------------------------- */

export interface AdminCategoryChild {
  slug: string;
  name: string;
  description: string | null;
  sortOrder: number;
  productCount: number;
  /** The part that appears in the URL: `women-unstitched` -> `unstitched`. */
  segment: string;
}

export interface AdminCategoryNode {
  slug: string;
  name: string;
  description: string | null;
  sortOrder: number;
  productCount: number;
  children: AdminCategoryChild[];
}

export interface CategorySaveInput {
  name: string;
  parentSlug: string | null;
  description: string;
  /** Only sent when editing; a new one derives its segment from the name. */
  segment?: string;
  /** Required to write over an existing slug, so a rename has to be meant. */
  allowRename?: boolean;
}

export function fetchAdminCategories(): Promise<{ categories: AdminCategoryNode[] }> {
  return request<{ categories: AdminCategoryNode[] }>("/api/admin/categories");
}

export async function saveCategory(input: CategorySaveInput): Promise<{ slug: string }> {
  const body = await request<{ category: { slug: string } }>("/api/admin/categories", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return body.category;
}
