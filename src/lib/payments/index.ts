/**
 * Payment providers. See docs/BUILD-SPEC.pdf Section 11.5.
 *
 * "Implement CodProvider fully and MockCardProvider as a stub that throws
 * 'not configured'." Cash on Delivery is the only live method at launch
 * (Section 16); card and bank transfer render as disabled "Coming soon" and
 * refuse loudly if anything ever routes an order to them.
 */

import type { PaymentMethodId, OrderDraft } from "@/types";
import type { PaymentProvider, PaymentInitResult, PaymentStatus } from "./types";

/**
 * Cash on Delivery. There is nothing to authorise up front: the order is
 * accepted immediately and payment is collected by the courier, so `initiate`
 * succeeds and the order stays `pending` until someone marks it paid.
 */
export const codProvider: PaymentProvider = {
  id: "cod",
  label: "Cash on Delivery",
  isEnabled: true,

  async initiate(order: OrderDraft): Promise<PaymentInitResult> {
    // Nothing is charged here and no third party is contacted. The only
    // sanity check worth making is that the order is actually payable on
    // delivery — an empty basket is not.
    if (order.items.length === 0) {
      return { ok: false, message: "There is nothing in this order." };
    }
    return { ok: true, message: "Payable in cash when your order arrives." };
  },

  async verify(): Promise<PaymentStatus> {
    // COD is only ever settled by hand once the courier reports back.
    return "pending";
  },
};

/**
 * Card. Rendered but disabled. If an order somehow reaches it, it throws
 * rather than silently accepting money it cannot take.
 */
export const mockCardProvider: PaymentProvider = {
  id: "card",
  label: "Card",
  isEnabled: false,

  async initiate(): Promise<PaymentInitResult> {
    throw new Error("Card payments are not configured.");
  },

  async verify(): Promise<PaymentStatus> {
    throw new Error("Card payments are not configured.");
  },
};

/** Bank transfer. Same posture as card: visible, disabled, loud if invoked. */
export const bankTransferProvider: PaymentProvider = {
  id: "bank_transfer",
  label: "Bank Transfer",
  isEnabled: false,

  async initiate(): Promise<PaymentInitResult> {
    throw new Error("Bank transfer is not configured.");
  },

  async verify(): Promise<PaymentStatus> {
    throw new Error("Bank transfer is not configured.");
  },
};

const providers: Record<PaymentMethodId, PaymentProvider> = {
  cod: codProvider,
  card: mockCardProvider,
  bank_transfer: bankTransferProvider,
};

export function getPaymentProvider(id: PaymentMethodId): PaymentProvider {
  return providers[id];
}

/** The methods a customer may actually choose right now. */
export function enabledPaymentMethods(): PaymentMethodId[] {
  return (Object.keys(providers) as PaymentMethodId[]).filter((id) => providers[id].isEnabled);
}

export type { PaymentProvider, PaymentInitResult, PaymentStatus } from "./types";
