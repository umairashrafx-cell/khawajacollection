-- Khawaja Collection — catalogue and order schema.
-- docs/BUILD-SPEC.pdf Section 8.3, applied as written, with additions marked.
--
-- Prices are integers in PKR throughout (Section 16). No numeric, no floats,
-- no paisa — `price integer not null check (price > 0)` is the whole rule.

create table categories (
  slug text primary key,
  name text not null,
  parent_slug text references categories(slug),
  description text,
  image_url text,
  sort_order int default 0
);

create table collections (
  slug text primary key,
  name text not null,
  tagline text,
  hero_image_url text,
  is_active boolean default true
);

create table products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  short_description text,
  price integer not null check (price > 0),
  sale_price integer check (sale_price is null or sale_price < price),
  category_slug text references categories(slug),
  subcategory_slug text references categories(slug),
  fabric text,
  pieces int,
  care text,
  tags text[] default '{}',
  rating numeric(2, 1) default 0,
  review_count int default 0,
  is_featured boolean default false,
  is_new_arrival boolean default false,
  is_best_seller boolean default false,
  is_active boolean default true,
  -- ADDITION to Section 8.3. Section 16 and the PDP both need it: bridal is
  -- made to order and swaps Add to Cart for an enquiry. The spec's TypeScript
  -- interface omits it too; see the addendum in src/types/index.ts.
  is_made_to_order boolean default false,
  created_at timestamptz default now()
);

create table product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade,
  url text not null,
  alt text,
  sort_order int default 0,
  is_primary boolean default false
);

create table product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade,
  sku text unique not null,
  size text not null,
  color_name text,
  color_hex text,
  stock int default 0 check (stock >= 0),
  price_override integer
);

create table product_collections (
  product_id uuid references products(id) on delete cascade,
  collection_slug text references collections(slug) on delete cascade,
  primary key (product_id, collection_slug)
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null, -- KC-2026-00042
  user_id uuid references auth.users(id),
  email text,
  phone text not null,
  ship_name text,
  ship_line1 text,
  ship_line2 text,
  ship_city text,
  ship_province text,
  ship_postal text,
  -- ADDITION to Section 8.3: Section 11.5 collects delivery notes at checkout
  -- and the spec's table has nowhere to put them.
  ship_notes text,
  subtotal integer,
  shipping integer,
  discount integer,
  total integer,
  payment_method text check (payment_method in ('cod', 'card', 'bank_transfer')),
  payment_status text default 'pending',
  status text default 'placed' check (
    status in (
      'placed',
      'confirmed',
      'processing',
      'shipped',
      'out_for_delivery',
      'delivered',
      'cancelled'
    )
  ),
  created_at timestamptz default now()
);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  product_id uuid,
  variant_id uuid,
  name_snapshot text,
  size text,
  color_name text,
  unit_price integer,
  quantity int
);

create table wishlists (
  user_id uuid references auth.users(id) on delete cascade,
  product_id uuid references products(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, product_id)
);

-- Indexes, Section 8.3.
create index on products (category_slug, is_active);
create index on products (created_at desc);
create index on product_variants (product_id);
create index on orders (order_number);

-- ADDITIONS. The PLP filters on subcategory constantly and the PDP resolves a
-- product by slug on every request; both are hot paths that Section 8.3's
-- index list does not cover.
create index on products (subcategory_slug, is_active);
create index on product_images (product_id, sort_order);
create index on order_items (order_id);
