// Mock order + customer service. Ready to be pointed at a real backend:
// each function is async and returns plain serialisable objects.
import { shippingConfig, promoCodes } from "@/data/promos";

const STORE_KEY = "kc_orders_v1";

function read() {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(STORE_KEY) || "[]");
  } catch {
    return [];
  }
}

function write(rows) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORE_KEY, JSON.stringify(rows));
}

export function quote(items, promo) {
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  let discount = 0;
  let shipping =
    subtotal >= shippingConfig.freeShippingThreshold || subtotal === 0
      ? 0
      : shippingConfig.flatRate;
  const rule = promoCodes.find((p) => p.code === (promo || "").toUpperCase());
  if (rule && subtotal >= rule.minSubtotal) {
    if (rule.type === "percent") discount = Math.round((subtotal * rule.value) / 100);
    if (rule.type === "shipping") shipping = 0;
  }
  return {
    subtotal,
    discount,
    shipping,
    total: Math.max(subtotal - discount + shipping, 0),
    promoApplied: !!rule,
  };
}

export async function placeOrder({ items, customer, paymentMethod, promo }) {
  const totals = quote(items, promo);
  const order = {
    id: "KC" + Date.now().toString().slice(-8),
    createdAt: new Date().toISOString(),
    status: "confirmed",
    paymentMethod,
    items,
    customer,
    totals,
    timeline: [
      { label: "Order confirmed", done: true },
      { label: "Packed in studio", done: false },
      { label: "Handed to courier", done: false },
      { label: "Delivered", done: false },
    ],
  };
  write([order, ...read()]);
  return order;
}

export async function getOrder(id) {
  return read().find((o) => o.id.toLowerCase() === String(id).trim().toLowerCase()) ?? null;
}

export async function listOrders() {
  return read();
}
