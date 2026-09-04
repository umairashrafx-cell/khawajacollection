/**
 * The order book.
 *
 * FILTERS LIVE IN THE URL, not in component state. Staff share links
 * ("look at KC-2026-00042"), keep a tab pinned on `?status=placed` all day,
 * and hit the back button. Component state loses all three.
 *
 * The phone number is on the row on purpose. The single most common thing a
 * shopkeeper does with an order list is ring the customer, and making them
 * open a detail page to find the number would be a worse tool than a
 * spreadsheet.
 */

import { createFileRoute } from "@tanstack/react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ChevronRight, Download, Search } from "lucide-react";
import { useState } from "react";

import { AppLink } from "@/components/layout/AppLink";
import { OrderStatusBadge } from "@/components/account/OrderStatusSteps";
import { ORDER_STEPS } from "@/lib/order-steps";
import { downloadOrdersCsv, fetchAdminOrders } from "@/lib/auth/admin-api";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import { formatDate, formatPKR } from "@/lib/format";

export const Route = createFileRoute("/admin/orders/")({
  validateSearch: (search: Record<string, unknown>) => ({
    status: typeof search["status"] === "string" ? search["status"] : undefined,
    q: typeof search["q"] === "string" ? search["q"] : undefined,
    page: Number(search["page"]) > 1 ? Number(search["page"]) : undefined,
  }),
  head: () => ({
    meta: [{ title: "Orders | Admin" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: AdminOrders,
});

const FILTERS = [
  { status: undefined, label: "All" },
  ...ORDER_STEPS.map((s) => ({ status: s.status as string | undefined, label: s.label })),
  { status: "cancelled" as string | undefined, label: "Cancelled" },
];

function AdminOrders() {
  const { status, q, page } = Route.useSearch();
  const navigate = Route.useNavigate();
  // Server-authoritative, so these queries still fire for an admin whose
  // token predates the role. See src/hooks/useAdminAccess.ts.
  const { isAdmin } = useAdminAccess();
  const [term, setTerm] = useState(q ?? "");
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const { data, isPending, error, isPlaceholderData } = useQuery({
    queryKey: ["admin-orders", status, q, page],
    queryFn: () => fetchAdminOrders({ status, q, page }),
    enabled: isAdmin,
    // Keeps the previous page on screen while the next loads, so the table
    // does not collapse to a spinner every time a filter changes.
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.perPage)) : 1;
  const current = page ?? 1;

  return (
    <div>
      <h1 className="font-display text-2xl text-kc-ink">Orders</h1>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void navigate({
            search: (prev) => ({ ...prev, q: term.trim() || undefined, page: undefined }),
          });
        }}
        className="mt-5 flex gap-2"
        role="search"
      >
        <label htmlFor="admin-order-search" className="sr-only">
          Search by order number or phone
        </label>
        <input
          id="admin-order-search"
          type="search"
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          placeholder="Order number or phone"
          className="min-h-11 w-full max-w-sm border border-kc-line bg-kc-white px-3 text-sm text-kc-ink"
        />
        <button
          type="submit"
          className="flex min-h-11 items-center gap-2 bg-kc-ink px-4 text-sm text-kc-paper"
        >
          <Search className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only sm:not-sr-only">Search</span>
        </button>

        {/* Exports whatever the current filter shows, not just this page. */}
        <button
          type="button"
          disabled={exporting}
          onClick={() => {
            setExporting(true);
            setExportError(null);
            downloadOrdersCsv({ status, q })
              .catch((e: Error) => setExportError(e.message))
              .finally(() => setExporting(false));
          }}
          className="ml-auto flex min-h-11 items-center gap-2 border border-kc-line bg-kc-white px-4 text-sm text-kc-charcoal transition-colors hover:border-kc-ink disabled:opacity-60"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          {exporting ? "Preparing…" : "Export CSV"}
        </button>
      </form>

      {exportError ? (
        <p role="alert" className="mt-2 text-sm text-kc-sale">
          {exportError}
        </p>
      ) : null}

      <nav aria-label="Filter by status" className="mt-4 -mx-4 overflow-x-auto px-4">
        <ul className="flex gap-2">
          {FILTERS.map((filter) => {
            const active = status === filter.status;
            return (
              <li key={filter.label} className="shrink-0">
                <AppLink
                  href={filter.status ? `/admin/orders?status=${filter.status}` : "/admin/orders"}
                  {...(active ? { "aria-current": "page" as const } : {})}
                  className={`flex min-h-11 items-center whitespace-nowrap border px-3 text-sm transition-colors ${
                    active
                      ? "border-kc-ink bg-kc-ink text-kc-paper"
                      : "border-kc-line bg-kc-white text-kc-charcoal hover:border-kc-ink"
                  }`}
                >
                  {filter.label}
                  {data && filter.status ? (
                    <span className="ml-2 text-xs opacity-70">
                      {data.counts[filter.status] ?? 0}
                    </span>
                  ) : null}
                </AppLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {error ? (
        <p role="alert" className="mt-6 text-sm text-kc-sale">
          {error instanceof Error ? error.message : "Could not load orders."}
        </p>
      ) : null}

      {isPending ? <p className="mt-6 text-sm text-kc-muted">Loading orders…</p> : null}

      {data && data.orders.length === 0 ? (
        <p className="mt-6 border border-kc-line bg-kc-white p-5 text-sm text-kc-charcoal">
          {q || status
            ? "No orders match that. Try clearing the filter."
            : "No orders yet. They will appear here the moment one is placed."}
        </p>
      ) : null}

      {data && data.orders.length > 0 ? (
        <>
          <div
            className={`mt-6 overflow-x-auto border border-kc-line bg-kc-white transition-opacity ${
              isPlaceholderData ? "opacity-60" : ""
            }`}
          >
            <table className="w-full min-w-[42rem] text-sm">
              <caption className="sr-only">Orders{status ? `, filtered to ${status}` : ""}</caption>
              <thead className="border-b border-kc-line text-left">
                <tr className="text-xs uppercase tracking-wide text-kc-muted">
                  <th scope="col" className="px-4 py-3 font-medium">
                    Order
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Placed
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Customer
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">
                    Total
                  </th>
                  <th scope="col" className="px-4 py-3">
                    <span className="sr-only">Open</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-kc-line">
                {data.orders.map((order) => (
                  <tr key={order.orderNumber} className="hover:bg-kc-sand">
                    <td className="px-4 py-3">
                      {/*
                        UNDERLINED ALWAYS, NOT ON HOVER. The row already
                        highlights on hover, so a link that only reveals itself
                        on hover is invisible inside it: the whole row looks
                        interactive and only eight characters of it are. Umair
                        clicked the status badge twice before saying it did not
                        work, which is the correct conclusion from what was on
                        screen.

                        min-h-11 because this is the way into every order and
                        it was a 16px-tall target on a phone.
                      */}
                      <AppLink
                        href={`/admin/orders/${order.orderNumber}`}
                        className="kc-price inline-flex min-h-11 items-center font-medium text-kc-ink underline underline-offset-4 decoration-kc-muted hover:decoration-kc-ink"
                      >
                        {order.orderNumber}
                      </AppLink>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-kc-charcoal">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="block text-kc-ink">{order.shipping.name}</span>
                      {/* Tappable: on a phone, this row IS the call button. */}
                      <a
                        href={`tel:${order.phone}`}
                        className="kc-price text-xs text-kc-charcoal underline-offset-4 hover:underline"
                      >
                        {order.phone}
                      </a>
                    </td>
                    <td className="px-4 py-3">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="kc-price whitespace-nowrap px-4 py-3 text-right text-kc-ink">
                      {formatPKR(order.totals.total)}
                    </td>
                    {/*
                      A second way in, at the end of the row where the eye
                      finishes. Redundant with the order number on purpose:
                      the status badge sits between them and reads as a
                      button, so one obvious action on each side of it removes
                      the ambiguity rather than explaining it away.
                    */}
                    <td className="px-4 py-3 text-right">
                      <AppLink
                        href={`/admin/orders/${order.orderNumber}`}
                        className="inline-flex min-h-11 items-center gap-1 text-sm text-kc-charcoal underline-offset-4 hover:text-kc-ink hover:underline"
                      >
                        Open
                        <ChevronRight className="h-4 w-4" aria-hidden="true" />
                        <span className="sr-only">order {order.orderNumber}</span>
                      </AppLink>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 ? (
            <div className="mt-5 flex items-center justify-between text-sm">
              <p className="text-kc-muted">
                Page {current} of {totalPages} · {data.total} orders
              </p>
              <div className="flex gap-2">
                <AppLink
                  href={`/admin/orders?${new URLSearchParams({
                    ...(status ? { status } : {}),
                    ...(q ? { q } : {}),
                    ...(current > 2 ? { page: String(current - 1) } : {}),
                  })}`}
                  aria-disabled={current === 1}
                  className={`flex min-h-11 items-center border border-kc-line px-4 ${
                    current === 1 ? "pointer-events-none opacity-40" : "hover:border-kc-ink"
                  }`}
                >
                  Previous
                </AppLink>
                <AppLink
                  href={`/admin/orders?${new URLSearchParams({
                    ...(status ? { status } : {}),
                    ...(q ? { q } : {}),
                    page: String(current + 1),
                  })}`}
                  aria-disabled={current >= totalPages}
                  className={`flex min-h-11 items-center border border-kc-line px-4 ${
                    current >= totalPages ? "pointer-events-none opacity-40" : "hover:border-kc-ink"
                  }`}
                >
                  Next
                </AppLink>
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
