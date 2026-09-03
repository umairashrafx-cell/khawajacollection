export function formatPrice(value, currency = "PKR") {
  return `${currency} ${Number(value || 0).toLocaleString("en-PK")}`;
}

export function discountPercent(price, compareAt) {
  if (!compareAt || compareAt <= price) return null;
  return Math.round(((compareAt - price) / compareAt) * 100);
}

export function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString("en-PK", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}
