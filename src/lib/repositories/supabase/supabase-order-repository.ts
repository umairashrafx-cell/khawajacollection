/**
 * Orders in Postgres. docs/BUILD-SPEC.pdf Section 8.3, Phase 8.
 *
 * This is what retires the warning in MockOrderRepository: orders written here
 * survive a restart, a redeploy and a cold isolate, so a tracking lookup in
 * one invocation can find an order placed in another. Nothing else changes —
 * it satisfies the same interface, so /api/orders and /api/track-order were
 * not touched.
 *
 * EVERY QUERY IN THIS FILE USES THE SERVICE ROLE, AND THAT IS THE DESIGN.
 * 0002_rls.sql gives `anon` no select policy on orders at all, deliberately:
 * any policy loose enough to allow "order number plus phone" is loose enough
 * to allow enumeration one order number at a time. So the browser never reads
 * an order directly. It asks a server route, that route decides whether the
 * caller has earned the answer, and only then does this run. The service role
 * key is server-only (src/lib/supabase/client.ts) and importing this from a
 * component throws rather than leaks.
 *
 * ORDER NUMBERS come from the database (0003_accounts.sql), not from here.
 * A counter in application code is a race as soon as there are two processes,
 * and there always are.
 */

import { normalizePakistaniPhone } from "@/lib/format";
import { serviceClient } from "@/lib/supabase/client";
import type { Order, OrderItem, OrderStatus, PaymentMethodId, ShippingAddress } from "@/types";
import type {
  AdminOrderPage,
  AdminOrderQuery,
  CreateOrderInput,
  OrderRepository,
} from "../order-repository";

interface OrderRow {
  id: string;
  order_number: string;
  email: string | null;
  phone: string;
  ship_name: string | null;
  ship_line1: string | null;
  ship_line2: string | null;
  ship_city: string | null;
  ship_province: string | null;
  ship_postal: string | null;
  ship_notes: string | null;
  subtotal: number | null;
  shipping: number | null;
  discount: number | null;
  total: number | null;
  payment_method: string | null;
  payment_status: string | null;
  status: string | null;
  created_at: string;
  order_items: {
    product_id: string | null;
    variant_id: string | null;
    name_snapshot: string | null;
    size: string | null;
    color_name: string | null;
    unit_price: number | null;
    quantity: number | null;
  }[];
}

const SELECT = `
  id, order_number, email, phone,
  ship_name, ship_line1, ship_line2, ship_city, ship_province, ship_postal, ship_notes,
  subtotal, shipping, discount, total,
  payment_method, payment_status, status, created_at,
  order_items ( product_id, variant_id, name_snapshot, size, color_name, unit_price, quantity )
`;

/**
 * `order_items` has no slug column in Section 8.3, and adding one would
 * duplicate something `products.slug` already owns. The PDP link is rebuilt
 * from the product id at read time instead; a line whose product has since
 * been deleted simply has no link, which is correct.
 */
async function slugsFor(productIds: string[]): Promise<Map<string, string>> {
  const ids = [...new Set(productIds)].filter(Boolean);
  if (ids.length === 0) return new Map();

  const { data } = await (await serviceClient()).from("products").select("id, slug").in("id", ids);
  return new Map(((data ?? []) as { id: string; slug: string }[]).map((r) => [r.id, r.slug]));
}

function toOrder(row: OrderRow, slugs: Map<string, string>): Order {
  const shipping: ShippingAddress = {
    name: row.ship_name ?? "",
    line1: row.ship_line1 ?? "",
    ...(row.ship_line2 ? { line2: row.ship_line2 } : {}),
    city: row.ship_city ?? "",
    province: (row.ship_province ?? "") as ShippingAddress["province"],
    ...(row.ship_postal ? { postalCode: row.ship_postal } : {}),
    ...(row.ship_notes ? { notes: row.ship_notes } : {}),
  };

  const items: OrderItem[] = row.order_items.map((line) => ({
    productId: line.product_id ?? "",
    variantId: line.variant_id ?? "",
    nameSnapshot: line.name_snapshot ?? "",
    slug: slugs.get(line.product_id ?? "") ?? "",
    size: line.size ?? "",
    colorName: line.color_name ?? "",
    unitPrice: line.unit_price ?? 0,
    quantity: line.quantity ?? 0,
  }));

  return {
    id: row.id,
    orderNumber: row.order_number,
    ...(row.email ? { email: row.email } : {}),
    phone: row.phone,
    shipping,
    items,
    totals: {
      subtotal: row.subtotal ?? 0,
      shipping: row.shipping ?? 0,
      discount: row.discount ?? 0,
      total: row.total ?? 0,
    },
    paymentMethod: (row.payment_method ?? "cod") as PaymentMethodId,
    paymentStatus: (row.payment_status ?? "pending") as Order["paymentStatus"],
    status: (row.status ?? "placed") as OrderStatus,
    createdAt: row.created_at,
  };
}

async function hydrate(rows: OrderRow[]): Promise<Order[]> {
  const slugs = await slugsFor(
    rows.flatMap((row) => row.order_items.map((line) => line.product_id ?? "")),
  );
  return rows.map((row) => toOrder(row, slugs));
}

/** Order numbers are printed, screenshotted and retyped. Compare them leniently. */
function tidy(orderNumber: string): string {
  return orderNumber.replace(/\s+/g, "");
}

export class SupabaseOrderRepository implements OrderRepository {
  async create(input: CreateOrderInput): Promise<Order> {
    const supabase = await serviceClient();
    const { draft, items, totals } = input;

    // order_number is omitted: the column defaults to next_order_number(), so
    // Postgres allocates it and hands it back in the returning row.
    const { data: created, error } = await supabase
      .from("orders")
      .insert({
        ...(input.userId ? { user_id: input.userId } : {}),
        email: draft.email ?? null,
        phone: draft.phone,
        ship_name: draft.shipping.name,
        ship_line1: draft.shipping.line1,
        ship_line2: draft.shipping.line2 ?? null,
        ship_city: draft.shipping.city,
        ship_province: draft.shipping.province,
        ship_postal: draft.shipping.postalCode ?? null,
        ship_notes: draft.shipping.notes ?? null,
        subtotal: totals.subtotal,
        shipping: totals.shipping,
        discount: totals.discount,
        total: totals.total,
        payment_method: draft.paymentMethod,
        payment_status: "pending",
        status: "placed",
      })
      .select("id, order_number, created_at")
      .single();

    if (error || !created) {
      throw new Error(`Order could not be saved: ${error?.message ?? "no row returned"}`);
    }

    const row = created as unknown as { id: string; order_number: string; created_at: string };

    const { error: itemsError } = await supabase.from("order_items").insert(
      items.map((item) => ({
        order_id: row.id,
        product_id: item.productId,
        variant_id: item.variantId,
        name_snapshot: item.nameSnapshot,
        size: item.size,
        color_name: item.colorName,
        unit_price: item.unitPrice,
        quantity: item.quantity,
      })),
    );

    if (itemsError) {
      // An order with a number but no lines is worse than no order: the
      // customer holds a reference that tracking will render as empty. There
      // is no transaction across two PostgREST calls, so the header is removed
      // by hand and the checkout reports failure.
      await supabase.from("orders").delete().eq("id", row.id);
      throw new Error(`Order could not be saved: ${itemsError.message}`);
    }

    return {
      id: row.id,
      orderNumber: row.order_number,
      ...(draft.email ? { email: draft.email } : {}),
      phone: draft.phone,
      shipping: draft.shipping,
      items,
      totals,
      paymentMethod: draft.paymentMethod,
      paymentStatus: "pending",
      status: "placed",
      createdAt: row.created_at,
    };
  }

  async findForTracking(orderNumber: string, contact: string): Promise<Order | null> {
    // `ilike` with no wildcards is an exact comparison that ignores case.
    const { data, error } = await (
      await serviceClient()
    )
      .from("orders")
      .select(SELECT)
      .ilike("order_number", tidy(orderNumber))
      .maybeSingle();

    if (error || !data) return null;
    const row = data as unknown as OrderRow;

    // Knowing the order number alone is not enough to read someone else's
    // address. The stored phone is normalised to +92, but a customer types
    // whatever they think of — nearly always the 03xx form — so both sides go
    // through the same normaliser before they are compared.
    const asPhone = normalizePakistaniPhone(contact);
    const typed = contact.replace(/\s+/g, "").toLowerCase();
    const matches =
      (asPhone !== null && asPhone === row.phone) ||
      (row.email !== null && row.email.replace(/\s+/g, "").toLowerCase() === typed);

    if (!matches) return null;
    const [order] = await hydrate([row]);
    return order ?? null;
  }

  async listForUser(userId: string): Promise<Order[]> {
    const { data, error } = await (
      await serviceClient()
    )
      .from("orders")
      .select(SELECT)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(`Order history query failed: ${error.message}`);
    return hydrate((data ?? []) as unknown as OrderRow[]);
  }

  async findForUser(userId: string, orderNumber: string): Promise<Order | null> {
    // Scoped by user_id as well as order number, so guessing a number that
    // belongs to someone else returns nothing rather than their address.
    const { data, error } = await (
      await serviceClient()
    )
      .from("orders")
      .select(SELECT)
      .eq("user_id", userId)
      .ilike("order_number", tidy(orderNumber))
      .maybeSingle();

    if (error || !data) return null;
    const [order] = await hydrate([data as unknown as OrderRow]);
    return order ?? null;
  }

  /* --- Admin --------------------------------------------------------- */

  async listAll(query: AdminOrderQuery): Promise<AdminOrderPage> {
    const supabase = await serviceClient();
    const perPage = Math.min(query.perPage ?? 25, 100);
    const page = Math.max(1, query.page ?? 1);

    let rows = supabase.from("orders").select(SELECT, { count: "exact" });

    if (query.status) rows = rows.eq("status", query.status);

    if (query.q?.trim()) {
      const term = query.q.trim();
      // Order number or phone. The phone is stored normalised to +92, so a
      // search for the 03xx form people actually type is normalised the same
      // way before it is compared — the same trap that broke guest tracking.
      const asPhone = normalizePakistaniPhone(term);
      const like = `%${term.replace(/[%_]/g, "")}%`;
      rows = rows.or(
        asPhone
          ? `order_number.ilike.${like},phone.eq.${asPhone}`
          : `order_number.ilike.${like},phone.ilike.${like}`,
      );
    }

    const from = (page - 1) * perPage;
    const { data, error, count } = await rows
      .order("created_at", { ascending: false })
      .range(from, from + perPage - 1);

    if (error) throw new Error(`Admin order query failed: ${error.message}`);

    // Counts and revenue are over the WHOLE table, not the current page — a
    // dashboard that only counted what fits on screen would be worse than no
    // dashboard. Selecting just the two columns keeps it cheap.
    const { data: totals } = await supabase.from("orders").select("status, total");
    const counts: Record<string, number> = {};
    let revenue = 0;
    for (const row of (totals ?? []) as { status: string | null; total: number | null }[]) {
      const status = row.status ?? "placed";
      counts[status] = (counts[status] ?? 0) + 1;
      if (status !== "cancelled") revenue += row.total ?? 0;
    }

    return {
      items: await hydrate((data ?? []) as unknown as OrderRow[]),
      total: count ?? 0,
      page,
      perPage,
      counts,
      revenue,
    };
  }

  async updateStatus(orderNumber: string, status: OrderStatus): Promise<Order | null> {
    const { data, error } = await (
      await serviceClient()
    )
      .from("orders")
      .update({ status })
      .ilike("order_number", tidy(orderNumber))
      .select(SELECT)
      .maybeSingle();

    if (error) throw new Error(`Order status update failed: ${error.message}`);
    if (!data) return null;

    const [order] = await hydrate([data as unknown as OrderRow]);
    return order ?? null;
  }
}
