/**
 * Checkout. See docs/BUILD-SPEC.pdf Section 11.5.
 *
 * One page, three stacked sections — Contact, Shipping, Payment — with the
 * order summary sticky on the right at desktop and collapsed at the top on
 * mobile.
 *
 * This form collects and validates. It does not price anything: it posts
 * product ids, variant ids and quantities to /api/orders, which recomputes
 * every figure from the repository (Guardrail 5). The totals shown here are a
 * preview, and the server's answer is the one that counts.
 *
 * noindex per Section 7.
 */

import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Banknote, CreditCard, Landmark, Lock } from "lucide-react";

import { AppLink } from "@/components/layout/AppLink";
import { CartTotals } from "@/components/cart/CartSummary";
import { Container } from "@/components/layout/Container";
import { Image } from "@/components/media/Image";
import { paymentMethods, provinces } from "@/config/site";
import { Field } from "@/components/forms/Field";
import { inputClass } from "@/components/forms/input-class";
import { accessToken } from "@/lib/auth/session-store";
import { checkoutSchema, type CheckoutInput } from "@/lib/checkout-schema";
import { formatPKR } from "@/lib/format";
import { announce } from "@/store/announcer";
import { clearCart, useCartHydrated, useCartLines, useCartSubtotal } from "@/store/cart-store";
import type { PaymentMethodId } from "@/types";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout | Khawaja Collection" },
      { name: "description", content: "Complete your Khawaja Collection order." },
      { name: "robots", content: "noindex, nofollow" },
    ],
    links: [{ rel: "canonical", href: "/checkout" }],
  }),
  component: CheckoutPage,
});

const PAYMENT_ICON = { cod: Banknote, card: CreditCard, bank_transfer: Landmark } as const;

function CheckoutPage() {
  const lines = useCartLines();
  const subtotal = useCartSubtotal();
  const hydrated = useCartHydrated();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutInput>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { paymentMethod: "cod" },
  });

  async function onSubmit(values: CheckoutInput) {
    setServerError(null);
    try {
      // Sent when signed in, so the order lands in the account history. The
      // server verifies it; a missing or stale token just means a guest
      // order, which is a supported outcome rather than an error.
      const token = accessToken();

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          ...values,
          // Ids and quantities only. Prices are the server's business.
          items: lines.map((line) => ({
            productId: line.productId,
            variantId: line.variantId,
            quantity: line.quantity,
          })),
        }),
      });

      const result = (await response.json()) as {
        ok?: boolean;
        error?: string;
        orderNumber?: string;
      };

      if (!response.ok || !result.ok || !result.orderNumber) {
        setServerError(result.error ?? "We could not place that order. Please try again.");
        announce(result.error ?? "The order could not be placed.");
        return;
      }

      clearCart();
      announce(`Order ${result.orderNumber} placed.`);
      void navigate({
        to: "/orders/$orderNumber",
        params: { orderNumber: result.orderNumber },
      } as never);
    } catch {
      setServerError("We could not reach the server. Check your connection and try again.");
    }
  }

  if (hydrated && lines.length === 0) {
    return (
      <Container>
        <div className="py-16 text-center">
          <h1 className="font-display text-[28px]">Your bag is empty</h1>
          <p className="mx-auto mt-3 max-w-sm text-sm text-kc-charcoal">
            Add something before checking out.
          </p>
          <AppLink
            href="/new-arrivals"
            className="mt-7 inline-flex min-h-11 items-center bg-kc-ink px-7 text-[12px] font-medium uppercase tracking-[0.08em] text-kc-paper"
          >
            Shop new in
          </AppLink>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="py-10 lg:py-14">
        <h1 className="font-display text-[28px] leading-tight md:text-[40px]">Checkout</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 gap-12 lg:flex" noValidate>
          <div className="min-w-0 flex-1 space-y-10">
            {/* 1 — Contact */}
            <Section title="Contact" step={1}>
              <Field
                label="Email"
                hint="Optional — for your order confirmation."
                error={errors.email?.message}
              >
                <input
                  type="email"
                  autoComplete="email"
                  {...register("email")}
                  className={inputClass(!!errors.email)}
                />
              </Field>
              <Field
                label="Mobile number"
                required
                hint="We use this for delivery updates."
                error={errors.phone?.message}
              >
                <input
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="0300 1234567"
                  {...register("phone")}
                  className={inputClass(!!errors.phone)}
                />
              </Field>
            </Section>

            {/* 2 — Shipping */}
            <Section title="Shipping" step={2}>
              <Field label="Full name" required error={errors.name?.message}>
                <input
                  autoComplete="name"
                  {...register("name")}
                  className={inputClass(!!errors.name)}
                />
              </Field>
              <Field label="Address line 1" required error={errors.line1?.message}>
                <input
                  autoComplete="address-line1"
                  {...register("line1")}
                  className={inputClass(!!errors.line1)}
                />
              </Field>
              <Field label="Address line 2" error={errors.line2?.message}>
                <input
                  autoComplete="address-line2"
                  {...register("line2")}
                  className={inputClass(!!errors.line2)}
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="City" required error={errors.city?.message}>
                  <input
                    autoComplete="address-level2"
                    {...register("city")}
                    className={inputClass(!!errors.city)}
                  />
                </Field>
                <Field label="Province" required error={errors.province?.message}>
                  <select
                    {...register("province")}
                    defaultValue=""
                    className={inputClass(!!errors.province)}
                  >
                    <option value="" disabled>
                      Choose a province
                    </option>
                    {provinces.map((province) => (
                      <option key={province} value={province}>
                        {province}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <Field
                label="Postal code"
                hint="Optional — leave blank if you are not sure."
                error={errors.postalCode?.message}
              >
                <input
                  autoComplete="postal-code"
                  {...register("postalCode")}
                  className={inputClass(!!errors.postalCode)}
                />
              </Field>
              <Field label="Delivery notes" error={errors.notes?.message}>
                <textarea
                  rows={3}
                  {...register("notes")}
                  className={`${inputClass(!!errors.notes)} py-2`}
                />
              </Field>
            </Section>

            {/* 3 — Payment */}
            <Section title="Payment" step={3}>
              <fieldset className="space-y-2">
                <legend className="sr-only">Payment method</legend>
                {paymentMethods.map((method) => {
                  const Icon = PAYMENT_ICON[method.id as PaymentMethodId];
                  return (
                    <label
                      key={method.id}
                      className={`flex min-h-14 items-center gap-3 border px-4 ${
                        method.isEnabled
                          ? "cursor-pointer border-kc-line has-[:checked]:border-kc-ink"
                          : "cursor-not-allowed border-kc-line bg-kc-sand/40 text-kc-muted"
                      }`}
                    >
                      <input
                        type="radio"
                        value={method.id}
                        disabled={!method.isEnabled}
                        {...register("paymentMethod")}
                        className="h-4 w-4 accent-kc-ink"
                      />
                      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span className="text-sm">{method.label}</span>
                      {method.note ? (
                        <span className="ml-auto text-xs text-kc-muted">{method.note}</span>
                      ) : null}
                    </label>
                  );
                })}
              </fieldset>
              <p className="mt-3 flex items-center gap-2 text-xs text-kc-muted">
                <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                No card details are collected anywhere on this site.
              </p>
            </Section>

            {serverError ? (
              <p
                role="alert"
                className="border border-kc-sale bg-kc-white px-4 py-3 text-sm text-kc-sale"
              >
                {serverError}
              </p>
            ) : null}
          </div>

          {/* Order summary — sticky at desktop, above the form on mobile. */}
          <aside className="mt-10 lg:mt-0 lg:w-[380px] lg:shrink-0">
            <div className="border border-kc-line bg-kc-white p-6 lg:sticky lg:top-24">
              <h2 className="font-display text-lg">Order summary</h2>

              <ul className="mt-4 space-y-4 border-b border-kc-line pb-4">
                {lines.map((line) => (
                  <li key={`${line.productId}:${line.variantId}`} className="flex gap-3">
                    <span className="block w-14 shrink-0 bg-kc-sand">
                      <Image
                        src={line.image}
                        alt={line.name}
                        width={900}
                        height={1200}
                        sizes="56px"
                        className="aspect-[3/4] w-full object-cover"
                      />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] text-kc-ink">{line.name}</span>
                      <span className="block text-xs text-kc-muted">
                        {line.colorName} · {line.size} · Qty {line.quantity}
                      </span>
                    </span>
                    <span className="kc-price text-[13px] font-medium">
                      {formatPKR(line.unitPrice * line.quantity)}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-4">
                <CartTotals subtotal={subtotal} />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !hydrated}
                className="mt-6 min-h-12 w-full bg-kc-ink text-[12px] font-medium uppercase tracking-[0.08em] text-kc-paper transition-colors hover:bg-kc-charcoal disabled:cursor-not-allowed disabled:bg-kc-muted"
              >
                {isSubmitting ? "Placing order…" : "Place order"}
              </button>
              <p className="mt-3 text-center text-xs text-kc-muted">
                Totals are confirmed on our server before your order is accepted.
              </p>
            </div>
          </aside>
        </form>
      </div>
    </Container>
  );
}

function Section({
  title,
  step,
  children,
}: {
  title: string;
  step: number;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="flex items-center gap-3 font-display text-xl">
        <span className="kc-price flex h-7 w-7 items-center justify-center rounded-full bg-kc-ink text-xs text-kc-paper">
          {step}
        </span>
        {title}
      </h2>
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}
