# Khawaja Collection (KC) — Project Memory

Read `docs/BUILD-SPEC.pdf` (text mirror: `docs/BUILD-SPEC.txt`) before doing anything.
Work one phase per session (spec Section 17). Do not let a session sprawl across phases.

## What this is

Premium Pakistani fashion e-commerce storefront. Mobile-first.
UX benchmark: LAAM. NEVER copy LAAM's assets, copy, colours, or markup.

## Stack

TanStack Start (SSR) + TanStack Router file-based routing / React 19 /
TypeScript strict / Tailwind v4 / shadcn-ui / Supabase (Phase 8) / Vercel or Cloudflare.

> **Deviation from spec Section 3, recorded deliberately per Section 3.3.**
> The spec recommends porting to Next.js 15 because "a Vite SPA ships an empty
> `<div id="root">`". That premise does not hold here: Lovable produced a
> **TanStack Start** app, not a Vite SPA. It already server-renders
> (`src/server.ts` + nitro), already has file-based routes with server loaders,
> already emits per-route `head()` metadata, canonical, OG and Product JSON-LD,
> and already generates `/sitemap.xml`. The SEO failure the port was meant to
> prevent is not present, so the port was not worth its cost.
>
> What we give up, and how it is covered:
>
> - **`next/image`** → we hand-roll a responsive `<Image>` component with
>   explicit width/height, `srcset`, `sizes` and AVIF/WebP sources (Phase 3).
> - **ISR** → nitro route cache rules (done in Phase 9: immutable on hashed
>   assets, a month on fonts, `no-store` on anything with a session in it).
> - **`generateStaticParams`** → TanStack prerender in `vite.config.ts`
>   (done in Phase 5). It crawls from `/` and writes 88 static HTML files,
>   including all 60 PDPs.
> - **`next/font`** → done in Phase 9: two families, latin subset only,
>   `display: swap`, self-hosted from `public/fonts`
>   (`npm run fonts` regenerates them).
>
> Everything else in the spec — tokens, types, repository seam, page specs,
> commerce rules, SEO plan, performance budget, a11y, guardrails — applies
> unchanged. Where the spec says `app/`, read `src/routes/`. Where it says
> `"use client"`, read "keep data fetching in route loaders, not effects".

## Commands

```
bun run dev        # local dev, http://localhost:8080
bun run build      # must pass before any commit
bun run lint
npx tsc --noEmit   # must be clean
npm run placeholders   # regenerate public/placeholders/*.svg
npm run catalogue      # catalogue summary + example repository queries
```

To measure a real production page load, build with the node preset and run the
output directly — the default `cloudflare-module` preset needs wrangler, and
`vite preview` cannot serve a nitro build:

```
NITRO_PRESET=node-server npm run build && node .output/server/index.mjs
```

## Hard rules

1. No product data inside components. Everything via `src/lib/repositories/*`.
2. Every route exports `head()` with title, description and canonical. No exceptions.
3. Data is fetched in route `loader`s (server side), never in `useEffect`.
   Interactivity lives in small leaf components.
4. Prices are integers in PKR. No floats. Format with `formatPKR()`.
5. Use design tokens (`--kc-*` CSS variables in `src/styles.css`).
   No arbitrary hex values in JSX.
6. Every image has explicit width, height, `sizes` and `alt`. Lazy by default;
   only the LCP hero is eager/preloaded.
7. No new dependency without asking first.
8. Mobile layout is designed separately, not scaled down from desktop.
   Never let a `.jsx` and a `.tsx` share a basename: Vite resolves `.jsx`
   first, so the old file silently wins and the import comes back undefined.
9. Do not invent social media URLs, phone numbers, addresses, prices, delivery
   timelines or refund windows. Use the `PLACEHOLDER` constants in
   `src/config/site.ts` and say so in the summary.
   Every COMMERCE placeholder is now filled: shipping rate, delivery estimate,
   contact details, opening hours, and the exchange window (7 days, supplied
   2026-09-05). What remains is LEGAL, and it renders as a visible
   "Placeholder:" badge on the live site. Those facts live in the `legal`
   block of `src/config/site.ts` — one place, not inline in three route files
   as they were. Business name, registered address and governing law were
   supplied 2026-09-05, leaving FOUR badges: court jurisdiction, effective
   date, refund processing time, order retention period. They are
   deliberately loud, and `Fact` in ContentPage.tsx makes the fallback
   impossible to forget at a new call site.
10. Run `bun run build` before telling me a phase is done.

## Style

- Components: PascalCase files in `src/components/<domain>/`
- Hooks: `use*.ts` in `src/hooks/`
- Types: `src/types/index.ts` — single source of truth
- New code is TypeScript. Lovable-era `.jsx` files migrate to `.tsx` as each
  phase touches them; do not do a big-bang rewrite.
- Prefer composition over props explosion. Max ~7 props per component.

## Repo constraints

This repo syncs with Lovable (see `AGENTS.md`). Never force-push, rebase, amend
or squash commits that are already pushed — it destroys the user's Lovable
project history. Keep `main` in a working state.

## Definition of done for any task

TypeScript clean, build passes, lint clean, responsive at 360 / 768 / 1024 / 1440,
keyboard navigable, no console errors, no hydration mismatch, no layout shift on
image load, no invented business facts.

## Phase status

- [x] **Phase 0** — Foundation: tokens, fonts, types, config, format helpers, folder structure
- [x] **Phase 1** — Data layer: `ProductRepository`, 72 mock products, placeholder image script
- [x] **Phase 2** — Layout shell: AnnouncementBar, Header, MegaMenu, MobileNav, Footer
- [x] **Phase 3** — ProductCard + homepage (12 sections)
- [x] **Phase 4** — PLP, filters, sorting, pagination
- [x] **Phase 5** — PDP
- [x] **Phase 6** — Cart, wishlist, search
- [x] **Phase 7** — Checkout, orders, tracking
- [~] **Phase 8** — Supabase migration. Schema, RLS, product repository, seed,
      order repository, Auth, account pages and the wishlist merge are all
      built. 60 products / 425 variants / 174 images are in Postgres and both
      repositories produce byte-identical listings, facets and PDPs.
      Migrations 0001–0003 are applied to the live project and Supabase's
      security advisors are clean.
      **One thing blocks calling it done:** `SUPABASE_SERVICE_ROLE_KEY` is
      empty in `.env.local`, so every server-side order path fails closed and
      order placement cannot be exercised end to end under `supabase`. The old
      key was pasted into a chat transcript and must be rotated before use.
      Also still open: the sign-up / wishlist-merge / order-history walkthrough
      (needs a real account, which only Umair can create), and uploading
      placeholder images to Storage — deliberately deferred, they are throwaway
      scaffolding due to be replaced by the real photography pipeline
      (Section 19).
- [~] **Phase 9** — SEO, performance, a11y, launch.
      Done: Section 13 in full (robots.txt, a sitemap rebuilt from the
      repository, Organization + WebSite + SearchAction, Open Graph on every
      route with a real 1200x630 PNG), the eight content pages, loading
      skeletons on all 15 loader routes, self-hosted latin-subset fonts,
      nitro cache rules + asset compression, and docs/LAUNCH-CHECKLIST.md.
      Accessibility: zero axe violations across 12 page types, all five
      overlays trap focus and close on Escape, 44px tap targets throughout.

      Lighthouse (mobile, node-server production build):

      | page    | Perf | A11y | BP  | SEO | LCP  |
      |---------|------|------|-----|-----|------|
      | home    | 70   | 100  | 100 | 100 | 5.2s |
      | /women  | 74   | 100  | 100 | 100 | 4.6s |
      | product | 86   | 100  | 100 | 100 | 3.4s |

      Homepage JS is 158 KB gzipped against a 180 KB budget, and CLS is
      0.001/0/0 against 0.05 — both within Section 14.

      **Performance is knowingly short of the >= 90 target, by decision.**
      LCP is the binding constraint on all three pages and on every one the
      LCP element is placeholder imagery. Section 14 wants AVIF/WebP with a
      responsive srcset; `<Image>` already accepts `sources` and `srcSet` and
      is passed neither, because generated SVGs and a stock JPEG have no
      variants to offer. Generating them needs an image library (`sharp`),
      and on 2026-09-04 Umair chose to defer that until the real photography
      arrives (Section 19) rather than tune images due to be deleted. Do not
      re-raise it as an open question — build the derivative pipeline once,
      against the real assets, and re-measure on Vercel then.

## The seed catalogue is gone from production

On 2026-09-06 Umair deleted all 71 placeholder products from Postgres, leaving
one real product he had created through the admin. The criterion was "no
uploaded photograph": every product whose images were all generated SVGs under
/placeholders. Verified afterwards — 1 product, 1 image, 1 variant, zero
orphaned rows, and both orders untouched, which is the order_items snapshot
design working as intended.

**src/data/products.ts STILL DEFINES ALL 72.** The mock catalogue was
deliberately not touched: it is what `VITE_PRODUCT_REPOSITORY=mock` runs on,
it is what `npm run catalogue` reports, and it is the only copy of the seed
data if any of it is ever wanted back. So the two repositories NO LONGER AGREE
about what is in the shop, and that is intentional rather than drift — the
claim elsewhere in this file that they produce byte-identical listings is now
true only of the code paths, not of the data.

Practical consequences:

- A local `mock` session shows 72 products and production shows 1. Do not read
  that as a bug.
- The prerender and the sitemap shrink to whatever is actually published. A
  deploy is needed after any bulk catalogue change, or the static pages and
  /sitemap.xml keep advertising URLs that now 404.
- `supabase/migrations/0006_bedsheets.sql` and `scripts/emit-category-sql.mjs`
  can regenerate the bedsheets; the other 60 come from
  `scripts/seed-supabase.mjs`.

## Bedsheets

A fourth department, added on request. `/bedsheets` plus
`/bedsheets/$subcategory` (Single, Double, King, Quilt Covers), 12 products,
and its own drawn placeholder imagery — a top-down made bed rather than the KC
monogram block, because a category whose whole appeal is the pattern cannot be
judged against twelve identical beige squares.

**Everything about them is invented**, like the other 60: names, copy, prices
(3,200–18,500), thread counts and stock are placeholders for the real bedding
range. Replace them before selling.

Three general things fell out of adding it, and they apply to any future
department:

- `SubcategoryNaming` in `src/lib/catalog-page.ts`. The subcategory heading
  template is possessive — "Women's Unstitched" — which produced
  "Bedsheets's King". Departments that name a THING pass `naming: "plain"`.
- `bedSizeRows` in `src/config/size-guide.ts`. A bedsheet has no chest, waist
  or hip; the PDP and the accordion both switch on `categorySlug`.
- `buildImages` in `src/data/products.ts` picks its placeholder pool by
  category.

`supabase/migrations/0006_bedsheets.sql` seeds them into Postgres and is
generated, not written: `node scripts/emit-category-sql.mjs bedsheets`.
Regenerate it rather than hand-editing, so the mock catalogue and Postgres
cannot drift. **Until it is applied AND the site is redeployed, /bedsheets is
an empty listing under `supabase`** — the page is prerendered at build time, so
applying the migration alone is not enough.

The homepage "Shop by category" strip is now EIGHT cards in a 4x2 grid, not
the spec's six in 3x2. A seventh tile leaves two holes, and dropping one of the
six clothing entry points to make room for Bedsheets would have cost more than
it bought — so the grid widened and took an eighth. Sale is that eighth: the
only other top-level listing with a card of its own, already in the main nav,
and the highest-intent link on the page.

The count and the column count have to stay divisible. A ninth card means going
back to three columns, not 4+4+1. And a tile's href must be a single segment:
`cardImage()` builds the art path from it, so `/women/formals` would ask for
`category-women/formals-4x5.svg`.

## Known debt from the Lovable prototype

**None left in code.** `src/` is now entirely TypeScript.

Phase 6 removed the prototype data/state layer (`src/context/ShopContext.jsx`,
`src/components/shop/`, `src/lib/legacy-shop-adapter.ts` and the prototype
`cart` / `wishlist` / `search` routes). Phase 7 rebuilt checkout, account,
tracking and order confirmation in TypeScript. Phase 9 rebuilt the sitemap from
the repository, which retired `src/services/catalogService.js` and
`src/data/legacy/{products,categories}.js`, then deleted the last six orphaned
Lovable components — `CategoryTiles`, `EditorialSplit`, `Hero`, `Newsletter`,
`SocialStrip` and `PageContainer` — along with `src/data/legacy/promos.js`,
their only remaining consumer.

Worth knowing why they lingered: each had a TypeScript replacement under a
*different* filename (`EditorialSplit` moved into `EditorialBanner.tsx`,
`Newsletter` into `NewsletterSection.tsx`), so a grep for the component name
kept finding hits and they read as live. Only checking actual imports showed
all six had none.
⚠ **ORDERS ARE IN-MEMORY WHENEVER `VITE_PRODUCT_REPOSITORY=mock`.**
`MockOrderRepository` holds orders in a module-level Map, so on Vercel or
Cloudflare the next request may hit a different isolate and a placed order will
usually be invisible to tracking. Under `supabase` orders are rows in Postgres
and this does not apply. **Do not take real orders on a mock deployment**, and
do not take them under `supabase` either until 0003 is applied and the service
role key is set — see the Phase 8 note above.
- `src/routes/category.$slug.tsx` and `product.$slug.tsx` are redirect-only,
  301ing every legacy URL to its new home. Delete once the old URLs stop
  appearing in Search Console.

## Stock is reserved, not just checked

`/api/orders` used to read a variant's stock, refuse the order if it was too
low, and never write the number back. Nothing else did either — no trigger, no
repository code — so the same last piece could be sold to an unlimited number
of customers while the stock screen went on calling it available.

Found by placing the first real order end to end (KC-2026-00001, 2026-09-04):
every field in the row was correct and the count did not move. It had been
there since Phase 7 and no amount of reading the code had caught it.

0007_stock_reservation.sql adds `reserve_variant_stock` and
`release_variant_stock`. The reserve is a single
`update ... where stock >= quantity returning stock`, so it cannot interleave:
a second caller sees the decremented value, its WHERE fails, and it gets NULL,
which callers must treat as a refusal and never as a zero. Checking and then
subtracting would still be two statements with a gap in the middle.

Both functions are granted to `service_role` ALONE and are not security
definer. A stock-subtracting RPC a browser can reach is a vandalism tool — a
loop over it would empty the shop in seconds. Verified from outside with the
publishable key: `permission denied for function`.

The order route holds every reservation it makes and releases them all if any
later step fails — a sold-out third line, unconfigured shipping, payment
refusing, or the order write throwing. Without that a failed checkout silently
eats stock nobody bought.

## Cancelling an order restocks it

The mirror of the reservation bug above, and found immediately after it: an
order could be cancelled and the stock never came back. On a cash-on-delivery
shop, where refused deliveries are ordinary, that drifts inventory downward
forever until a piece reads sold out with a pile of it in the shop.

`/api/admin/orders` now reads the order before writing it, because the right
behaviour depends on the TRANSITION, not the destination:

- into `cancelled` from anything else -> release every line's stock
- out of `cancelled` -> RE-RESERVE first, and refuse the whole status change
  with a 409 if any line cannot be taken. Reopening an order for goods that
  have since sold is worse than refusing to reopen it.
- `cancelled` -> `cancelled` -> nothing, so clicking twice cannot invent stock

`cancelled` is the only status that touches stock, and the only one that
safely can: it is the single point in the lifecycle where the goods are
certainly still on the shelf. There is no `returned` status in
`OrderStatus`; if one is ever added, returned goods should NOT auto-restock
(they may come back damaged) — count them in by hand.

## JazzCash and Easypaisa

Built on request. **Neither has ever been run against a sandbox** — no merchant
credentials existed when they were written — so the code follows each published
spec and has taken exactly zero real payments. Read the warning at the top of
`src/lib/payments/jazzcash.ts` and `easypaisa.ts` before switching either on.

Both are HOSTED REDIRECTS, not direct APIs. The customer pays on the gateway's
own domain; this shop never sees a wallet PIN. The direct mode exists and was
not used: it would put us in the business of handling other people's PINs, for
no gain a customer would notice.

TWO LOCKS, deliberately in different places:

- `VITE_PAYMENTS_JAZZCASH` / `VITE_PAYMENTS_EASYPAISA` are PUBLIC switches that
  decide whether the option is offered at checkout.
- The merchant credentials are server-only, read at call time, and checked
  again before any order is sent to a gateway.

Flipping the public flag alone cannot make the shop accept money it cannot
collect. Verified after the build that no credential name, no crypto call and
neither gateway hostname appears in any client asset.

THE ORDER IS NOW WRITTEN BEFORE PAYMENT STARTS, which reversed the order of
`/api/orders`. A gateway needs a reference that is unique, survives a round
trip through someone else's site, and can be matched against a callback twenty
minutes later; only the order number is all three, and it does not exist until
the row does. An unpaid order is a `pending` row we can chase; a payment we
cannot tie to an order is money in limbo.

`markPayment` is separate from `updateStatus` because `status` is where the
parcel is and `paymentStatus` is whether the money arrived. A COD order is
`delivered` and `pending` at once, quite legitimately.

Gotchas worth knowing before the sandbox run:

- Both gateways timestamp in **PKT, not UTC**, and reject anything outside a
  window around their own clock. Vercel runs in the US or Europe. `pktStamp`
  exists for that.
- JazzCash wants **paisa as an integer**; Easypaisa wants **rupees with two
  decimals**. Same money, two formats.
- JazzCash signs with **HMAC-SHA256**; Easypay encrypts with **AES-128-ECB**.
  The second one looks like a mistake next to the first. It is not.
- Easypay calls back **twice**: an `auth_token` ticket first, the real result
  only after we post that back to Confirm.jsf. Treating the first hit as
  success marks every abandoned payment as paid.
- The JazzCash callback is signed and is verified; the Easypay result post is
  not signed the same way. A forged Easypaisa callback could claim an order is
  paid, though it cannot change what the order costs. **Reconcile against the
  merchant portal before dispatching a prepaid order.**

0008_payment_reference.sql adds `orders.payment_reference` so a customer saying
"I paid" can be checked against the gateway's own records. Not yet applied.

## Admin panel

Not a spec phase — built on request, at `/admin`, behind the `admins` table
(0004) and `adminFromRequest`. Dashboard, orders, order detail, CSV export,
stock, and product create/edit with image upload (`product-images` bucket,
0005). The storefront chrome is stripped from `/admin` in `__root.tsx`, and
`vite.config.ts` keeps `/admin` and `/account` out of the prerender.

Staff membership is a ROW IN `admins`, never `app_metadata` — GoTrue rewrites
`raw_app_meta_data` on sign-in and silently destroyed the grant twice. See the
long note in `src/lib/auth/verify.ts` before changing how admin is decided.

⚠ **ADDING OR EDITING A PRODUCT NEEDS `SUPABASE_SERVICE_ROLE_KEY`.**
0002_rls.sql gives the catalogue no write policy, so `saveProduct` goes through
`serviceClient()`. With the key unset the form returns a 503 saying so and
nothing is written — same blocker as order placement. Stock edits, order status
and CSV export need it too.

Products can be UNPUBLISHED, which is what "remove" means here: off the shop,
out of search, out of the sitemap, unbuyable, and still fully editable in the
admin with every past order intact. It needed `listForAdmin` /
`getByIdForAdmin` on the product repository — admin reads that use the service
role and so step around the `is_active` filter in 0002_rls.sql. Without them
the checkbox would have hidden a product from its own editor, which is why it
was withheld until they existed.

One measured limit: unpublishing is immediate on every per-request path
(search, sitemap, checkout — which 409s) but the LISTING AND PRODUCT PAGES ARE
PRERENDERED, so a direct hit serves stale HTML until the next deploy. Verified
in production by unpublishing a live product and failing to buy it. Closing
that would mean dropping /products/** from the prerender and slowing the first
byte on every product page; not worth it.

Known gaps, deliberate:
- Removing an image from a product leaves the file in Storage. Orphaned bytes
  are cheaper than deleting a photo that a failed save then needed back.
- No collections field.

**Deleting a product does NOT damage order history**, and this file said the
opposite twice before it was checked. `order_items` holds `product_id` and
`variant_id` as bare uuids with NO foreign key, and snapshots name, size,
colour and unit price at the moment of sale, so a past order renders
identically whether the product still exists or not. Verified against
information_schema: only product_images, product_variants, product_collections
and wishlists reference products, all ON DELETE CASCADE.

Delete lives in a collapsed danger zone on the edit page and needs the
product's exact name typed. The NAME IS CHECKED ON THE SERVER, not only in the
dialog — a destructive endpoint guarded by a modal is unguarded. Storage does
not cascade, so `deleteProduct` removes the photographs first; a Storage
failure is logged and does not block the delete, because an orphaned byte
beats a product that cannot be removed.

Categories can be created and renamed at `/admin/categories`. Two things to
know before touching it:

- **A new SUBCATEGORY is live immediately.** `/women/$subcategory` resolves the
  URL segment against the `categories` table, so a row is a working page the
  moment it is saved, and it appears in the product form's dropdown.
- **A new DEPARTMENT is not.** Top-level listings are route files
  (`src/routes/bedsheets/`), so a new department needs a route, a descriptor in
  `src/config/catalog-routes.ts` and an entry in `src/config/nav.ts`. The admin
  screen says so on screen rather than leaving it to be discovered by a
  customer.
- **Renaming never moves a slug.** `slug` is the primary key, the URL, and what
  `products.category_slug` points at. The API refuses a reparent outright and
  treats a matching slug as a rename of name/description/order only.

`categoryRepository` now follows `VITE_PRODUCT_REPOSITORY` like the other two.
It read `src/data/categories.ts` under both settings until the admin could
write categories, at which point a row Postgres held and the site never read
would have been a lie on a form. Reads are anon-key and cached for 60s;
`saveCategory` uses the service role and drops the cache.

## Prerender coverage is best-effort, not guaranteed

`vite.config.ts` sets `crawlLinks: true` with `failOnError: false`, so the
static pages are whatever a crawl from `/` happens to reach, and a transient
failure silently drops one. Observed: a build produced 104 pages instead of
the usual 105, with no error in the log —
`/products/wali-charcoal-cotton-kurta` had fallen out.

**This is not a correctness bug.** A page that is not prerendered is served by
the SSR function instead, verified in production: that URL returns 200 with
the right title and h1. The cost is a slower first byte for that one page,
not a broken one.

Do not “fix” it by setting `failOnError: true` — that turns a slow page into
a failed deploy. If coverage needs to be guaranteed, enumerate the product
slugs from the repository into `pages` rather than relying on the crawl.

## State management

`zustand` is **not installed**. Section 12 specifies it; Hard Rule 7 forbids
adding a dependency unasked, so `src/store/` implements the same contract on
`useSyncExternalStore`:

- `persisted-store.ts` — subscribe/snapshot/persist, with the empty state as
  the server snapshot and a one-time read after mount
- `cart-store.ts` (`kc-cart-v1`), `wishlist-store.ts` (`kc-wishlist-v1`),
  `ui-store.ts` (one overlay at a time), `announcer.ts` (the polite live region)

Every read is gated behind a hydration flag, so no persisted value ever reaches
the first render. Swapping Zustand in means rewriting `persisted-store.ts` only.
