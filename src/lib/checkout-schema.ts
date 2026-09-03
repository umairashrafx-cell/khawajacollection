/**
 * Checkout validation. See docs/BUILD-SPEC.pdf Sections 11.5 and 16.
 *
 * One schema, used by the form and again by the server route. The client copy
 * is a convenience; the server copy is the one that counts, because a form can
 * be bypassed and an API cannot.
 */

import { z } from "zod";

import { provinces } from "@/config/site";
import { normalizePakistaniPhone } from "@/lib/format";

/**
 * Section 16 — accept `03XXXXXXXXX` and `+923XXXXXXXXX`, normalise to `+92`
 * before storing. The transform means everything downstream sees one shape.
 */
export const pakistaniPhone = z
  .string()
  .trim()
  .min(1, "Enter your mobile number.")
  .transform((value, ctx) => {
    const normalised = normalizePakistaniPhone(value);
    if (!normalised) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter a Pakistani mobile number, like 0300 1234567.",
      });
      return z.NEVER;
    }
    return normalised;
  });

const provinceValues = provinces as unknown as [string, ...string[]];

export const checkoutSchema = z.object({
  // Section 11.5 — email optional, phone required.
  email: z
    .string()
    .trim()
    .email("Enter a valid email address.")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  phone: pakistaniPhone,

  name: z.string().trim().min(2, "Enter the full name for delivery."),
  line1: z.string().trim().min(4, "Enter the street address."),
  line2: z
    .string()
    .trim()
    .optional()
    .or(z.literal("").transform(() => undefined)),
  city: z.string().trim().min(2, "Enter the city."),
  province: z.enum(provinceValues, { errorMap: () => ({ message: "Choose a province." }) }),
  // Section 16 — optional, and never blocks checkout.
  postalCode: z
    .string()
    .trim()
    .optional()
    .or(z.literal("").transform(() => undefined)),
  notes: z
    .string()
    .trim()
    .max(500, "Keep delivery notes under 500 characters.")
    .optional()
    .or(z.literal("").transform(() => undefined)),

  paymentMethod: z.enum(["cod", "card", "bank_transfer"]),
});

export type CheckoutInput = z.input<typeof checkoutSchema>;
export type CheckoutValues = z.output<typeof checkoutSchema>;

/**
 * What the client is allowed to say about the basket: what, which variant, how
 * many. Never a price — Section 12 and Guardrail 5 both require the server to
 * recompute every figure from the repository.
 */
export const orderLineSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().min(1),
  quantity: z.number().int().min(1).max(10),
});

export const orderRequestSchema = checkoutSchema.extend({
  items: z.array(orderLineSchema).min(1, "Your bag is empty."),
});

export type OrderRequest = z.output<typeof orderRequestSchema>;

export const trackOrderSchema = z.object({
  orderNumber: z.string().trim().min(4, "Enter your order number."),
  contact: z.string().trim().min(4, "Enter the phone number or email on the order."),
});
