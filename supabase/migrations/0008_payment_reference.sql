-- The gateway's own reference for a payment.
--
-- WHY IT IS WORTH A COLUMN. When a customer says "I paid and it says
-- pending", the only thing that resolves the argument is the transaction id
-- both sides can look up: ours in this table, theirs in the JazzCash or
-- Easypaisa merchant portal. Without it the two systems share only an amount
-- and a timestamp, which is not enough to identify one payment among a day's
-- worth.
--
-- Nullable, because Cash on Delivery has no reference and never will. An
-- empty column for the method that is currently doing all the business is
-- correct rather than untidy.
--
-- Indexed because the one query that matters is the reconciliation direction:
-- start from a reference in the gateway's report and find the order.

alter table orders add column if not exists payment_reference text;

create index if not exists orders_payment_reference_idx
  on orders (payment_reference)
  where payment_reference is not null;

comment on column orders.payment_reference is
  'Gateway transaction id (JazzCash pp_TxnRefNo, Easypaisa orderRefNum). Null for cash on delivery.';
