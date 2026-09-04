/**
 * The six order states, in order. docs/BUILD-SPEC.pdf Section 11.6.
 *
 * Data, not markup, and in its own module so the component that renders it can
 * keep Fast Refresh. `cancelled` deliberately has no entry here — it is not
 * further along the sequence, it is off it.
 */

import type { OrderStatus } from "@/types";

export const ORDER_STEPS: { status: OrderStatus; label: string; description: string }[] = [
  { status: "placed", label: "Placed", description: "We have your order." },
  { status: "confirmed", label: "Confirmed", description: "Stock checked and reserved." },
  { status: "processing", label: "Processing", description: "Being packed in the studio." },
  { status: "shipped", label: "Shipped", description: "Handed to the courier." },
  { status: "out_for_delivery", label: "Out for delivery", description: "With you today." },
  { status: "delivered", label: "Delivered", description: "Received. Thank you." },
];
