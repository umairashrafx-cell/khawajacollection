-- Taking stock off the shelf when an order is placed.
--
-- THE BUG THIS FIXES. /api/orders read a variant's stock, refused the order if
-- it was too low, and then never wrote the number back. Nothing else did
-- either — no trigger, no repository code. So the same last piece could be
-- sold to an unlimited number of customers, and the stock screen went on
-- reporting it as available. Found by placing the first real order end to end
-- (KC-2026-00001): every field was correct and the count did not move.
--
-- WHY A FUNCTION RATHER THAN A READ AND A WRITE. "Check the stock, then
-- subtract it" is two statements, and between them another request can read
-- the same number. Two customers both see the last piece, both pass the check,
-- and both orders are accepted. The window is small and the failure is silent,
-- which is the worst combination — you find out when one of them is told their
-- order is cancelled.
--
-- A single UPDATE ... WHERE stock >= quantity cannot interleave: Postgres
-- takes a row lock, the second caller sees the already-decremented value, its
-- WHERE fails, and it gets NULL back. That NULL is the "sold out" answer, and
-- it is the truth rather than a guess.
--
-- WHO MAY CALL THESE. Only service_role. They are deliberately NOT security
-- definer, and execute is revoked from anon and authenticated, because a
-- function that subtracts stock is a vandalism tool if a browser can reach it:
-- a loop over rpc('reserve_variant_stock') would empty the shop in seconds.
-- The server holds the secret key; nothing else can call these.

-- Returns the remaining stock, or NULL when the variant does not exist or
-- does not have enough. NULL means "not reserved" and callers must treat it
-- as a refusal, never as a zero.
create or replace function reserve_variant_stock(p_variant_id uuid, p_quantity int)
returns int
language sql
volatile
as $$
  update product_variants
     set stock = stock - p_quantity
   where id = p_variant_id
     and p_quantity > 0
     and stock >= p_quantity
  returning stock;
$$;

-- Puts stock back. Used when a later line in the same basket cannot be
-- reserved, or when the order write itself fails after the reservation —
-- otherwise a failed checkout would quietly consume stock nobody bought.
create or replace function release_variant_stock(p_variant_id uuid, p_quantity int)
returns int
language sql
volatile
as $$
  update product_variants
     set stock = stock + p_quantity
   where id = p_variant_id
     and p_quantity > 0
  returning stock;
$$;

revoke all on function reserve_variant_stock(uuid, int) from public, anon, authenticated;
revoke all on function release_variant_stock(uuid, int) from public, anon, authenticated;
grant execute on function reserve_variant_stock(uuid, int) to service_role;
grant execute on function release_variant_stock(uuid, int) to service_role;
