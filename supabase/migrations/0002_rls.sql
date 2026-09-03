-- Row Level Security. docs/BUILD-SPEC.pdf Section 8.3:
--
--   "enable Row Level Security on every table. Public select on products,
--    images, variants, categories, collections where is_active. Orders:
--    readable only by owning user_id, or via a server-side lookup by order
--    number + phone for guest tracking. Never expose a table that lets an
--    anonymous user read all orders."
--
-- The shape of this file follows from that last sentence. Postgres policies
-- cannot express "only if you already know the order number AND the phone" in
-- a way that is safe to expose to an anonymous client: any policy permissive
-- enough to allow the lookup is permissive enough to allow enumeration, one
-- order number at a time. So anonymous clients get NO select policy on orders
-- at all, and guest tracking runs through the server with the service role,
-- exactly as /api/track-order already does.

alter table categories enable row level security;
alter table collections enable row level security;
alter table products enable row level security;
alter table product_images enable row level security;
alter table product_variants enable row level security;
alter table product_collections enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table wishlists enable row level security;

/* ------------------------------------------------------------------ */
/* Catalogue — public read, active rows only                           */
/* ------------------------------------------------------------------ */

-- Categories have no is_active column in Section 8.3; the whole taxonomy is
-- public because the navigation is public.
create policy "categories are public"
  on categories for select
  to anon, authenticated
  using (true);

create policy "active collections are public"
  on collections for select
  to anon, authenticated
  using (is_active);

create policy "active products are public"
  on products for select
  to anon, authenticated
  using (is_active);

-- Images, variants and collection links are only visible through an active
-- product. Without the subquery an inactive product's price and stock would
-- still be readable through its variants.
create policy "images of active products are public"
  on product_images for select
  to anon, authenticated
  using (
    exists (
      select 1 from products
      where products.id = product_images.product_id
        and products.is_active
    )
  );

create policy "variants of active products are public"
  on product_variants for select
  to anon, authenticated
  using (
    exists (
      select 1 from products
      where products.id = product_variants.product_id
        and products.is_active
    )
  );

create policy "collection links of active products are public"
  on product_collections for select
  to anon, authenticated
  using (
    exists (
      select 1 from products
      where products.id = product_collections.product_id
        and products.is_active
    )
  )
  ;

-- No insert, update or delete policies on any catalogue table. Nothing writes
-- the catalogue from a browser; the seed script and any future admin run with
-- the service role, which bypasses RLS.

/* ------------------------------------------------------------------ */
/* Orders — never readable anonymously                                 */
/* ------------------------------------------------------------------ */

-- A signed-in customer may read their own orders and nothing else.
create policy "customers read their own orders"
  on orders for select
  to authenticated
  using (auth.uid() = user_id);

create policy "customers read their own order items"
  on order_items for select
  to authenticated
  using (
    exists (
      select 1 from orders
      where orders.id = order_items.order_id
        and orders.user_id = auth.uid()
    )
  );

-- Deliberately absent:
--   * any select policy for `anon` on orders or order_items
--   * any insert policy at all
-- Orders are created by /api/orders with the service role after it has
-- recomputed every price (Guardrail 5), and guest tracking is served by
-- /api/track-order, which requires the order number AND a matching contact.
-- A browser holding only the anon key can read no order, ever.

/* ------------------------------------------------------------------ */
/* Wishlists — private to their owner                                  */
/* ------------------------------------------------------------------ */

create policy "customers read their own wishlist"
  on wishlists for select
  to authenticated
  using (auth.uid() = user_id);

create policy "customers add to their own wishlist"
  on wishlists for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "customers remove from their own wishlist"
  on wishlists for delete
  to authenticated
  using (auth.uid() = user_id);
