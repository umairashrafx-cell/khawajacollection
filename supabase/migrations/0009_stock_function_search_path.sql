-- 0009 — pin the search_path on the stock functions.
--
-- Supabase's database linter flags both functions 0007 added as
-- function_search_path_mutable. 0003 had already fixed `next_order_number` the
-- same way and explains the reasoning at length; 0007 was written later and
-- simply did not repeat it.
--
-- WHAT THE WARNING ACTUALLY MEANS HERE. Without a pinned search_path, `update
-- product_variants` is resolved through whatever search_path the caller
-- happens to have. Anyone able to create a schema earlier on that path could
-- put their own `product_variants` in front of ours, and the function would
-- obligingly write to it.
--
-- THE RISK IS SMALL AND THE FIX IS FREE, which is the honest framing. Neither
-- function is SECURITY DEFINER, so both run as their caller and gain no
-- privilege from being called; execute is granted to `service_role` alone; and
-- service_role does not go around creating schemas. So this is not a hole
-- anyone can walk through today. It is a property worth having anyway, because
-- the day one of these becomes SECURITY DEFINER — which is a one-word change
-- somebody could make for a plausible reason — the warning stops being
-- theoretical and nobody will re-read this note first.
--
-- Everything is schema-qualified because `search_path = ''` means nothing is
-- found implicitly, including tables in public. That is the point: an empty
-- path cannot be shadowed.

create or replace function reserve_variant_stock(p_variant_id uuid, p_quantity int)
  returns int
  language sql
  volatile
  set search_path = ''
as $$
  update public.product_variants
     set stock = stock - p_quantity
   where id = p_variant_id
     and p_quantity > 0
     and stock >= p_quantity
  returning stock;
$$;

create or replace function release_variant_stock(p_variant_id uuid, p_quantity int)
  returns int
  language sql
  volatile
  set search_path = ''
as $$
  update public.product_variants
     set stock = stock + p_quantity
   where id = p_variant_id
     and p_quantity > 0
  returning stock;
$$;

-- Restated, not because CREATE OR REPLACE drops privileges — it does not, it
-- keeps the existing ownership and ACL — but because this is the single most
-- dangerous grant in the schema and it should be visible in any migration that
-- touches these two. A stock-subtracting function a browser can reach is a
-- vandalism tool: a loop over it empties the shop in seconds.
--
-- Re-running these is harmless and makes the file correct on its own terms
-- rather than only in sequence after 0007.
revoke all on function reserve_variant_stock(uuid, int) from public, anon, authenticated;
revoke all on function release_variant_stock(uuid, int) from public, anon, authenticated;
grant execute on function reserve_variant_stock(uuid, int) to service_role;
grant execute on function release_variant_stock(uuid, int) to service_role;
