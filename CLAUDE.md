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

## Empty listings are kept out of the index

After the seed catalogue was deleted, /sitemap.xml went on advertising 39 URLs
of which 38 rendered nothing: asking Google to index a shop and then showing it
an empty room. A thin-site impression is far slower to live down than to avoid.

Two halves, and they are driven by ONE predicate:

- `catalogHead` emits `noindex, follow` when the listing is unfiltered and
  `data.total === 0`. `follow` and not `nofollow`, because the page is not
  worth indexing but the nav and footer links leaving it still are.
- sitemap.xml leaves the URL out entirely.

These MUST agree. A sitemap asking for a URL the page itself refuses is the
same self-contradiction as one asking for a robots-blocked URL, and Search
Console reports it rather than quietly picking a winner. So neither side
decides it alone: both call `listingHasProducts` in src/lib/catalog-page.ts,
which calls `matches` -- the function both repositories filter with -- so the
sitemap's answer is by construction the answer the page will give.

Three conditions in `catalogHead`, each load-bearing:

- `data === undefined` is NOT emptiness. `head()` runs before the loader has
  resolved, and reading absence of an answer as "nothing here" would noindex
  every listing on its first render.
- `!filtered`. A filtered view already canonicalises to the bare listing, and
  `noindex` on a page whose canonical points elsewhere is a contradictory pair
  of signals that can carry the noindex across to the target -- dropping the
  very page we want kept. The canonical already handles empty filter
  combinations.
- The evergreen routes (/, /about, /contact, /faqs, the policy pages) are
  exempt. They are pages in their own right, not shelves.

The sitemap also stopped being a query per product: it was `getAllSlugs()` then
`getBySlug()` per slug, and is now a single `list({ perPage: 100_000 })`, which
it needs anyway to decide which listings have anything in them.

WATCH THE PRERENDER. Listing pages are prerendered, so the noindex is baked
into the static HTML -- the same limitation recorded under "Admin panel" for
unpublishing. **Adding the first bedsheet does not make /bedsheets indexable
until the site is rebuilt.** /sitemap.xml is a server route and updates
immediately, so between the two there is a window where the sitemap lists a URL
whose static HTML still says noindex. Deploy after any catalogue change, which
the section above already tells you to do for its own reasons.

Verified at both extremes. Under `supabase` (1 product) the sitemap fell from
39 URLs to 15, and all 20 pages checked agreed with it in both directions --
every listed URL indexable, every omitted one noindex. Under `mock` (72
products) it is 110 URLs and nothing is noindex, so the mock repository is
unaffected.

## A section with nothing in it does not render

The listing-level twin of the section above, one layer up. Every homepage
product rail drew its heading and its "View all" whether or not the query
returned anything, so on a one-product shop the page had two captioned holes:
Trending now over roughly 400px of nothing, because the one product is not
flagged a best seller, and the men's edit over the same, because it is a
women's piece. Neither was a data bug - the queries were right and the answers
were empty.

Two things fell out of fixing it:

- `pt-0` ON SECTIONS 7 AND 8 HAD TO BECOME CONDITIONAL. It exists to avoid
  stacking two Sections' padding and silently assumed the section above always
  rendered. Left hardcoded it would have jammed the women's edit against the
  editorial split - a spacing bug introduced by the fix rather than the data.
- The FEATURED COLLECTION block escaped the first pass, because it runs on no
  product query at all: it is a static photograph and an "Explore the
  collection" button. It pointed at `/collections/the-new-season`, which had
  nothing in it and answers `noindex`. A full-width dead end.

A NAVIGATION LINK AND A PROMISE ARE NOT THE SAME THING, which is why the
"Shop by category" strip stays even though most of its tiles currently lead to
empty listings. That strip is how someone browses the shop, it mirrors the
header nav, and an empty listing answers honestly with its own empty state. A
photograph with "Explore the collection" under it is an advertisement.

The "Follow Khawaja Collection" grid lost its six hardcoded placeholder SVGs
for the same reason: six identical grey "KC / PRODUCT IMAGE" squares under a
heading asking people to follow the shop, directly above the newsletter
sign-up. `socialTiles` in site.ts takes real photographs and the grid returns.

## Nothing claims the clothes are made in Lahore

Umair confirmed on 2026-09-08 that nothing is. The claim was in SEVENTEEN
files: the homepage meta description, `site.description`, the root default, the
web manifest, the footer, the hero headline, two PLP descriptions, two category
descriptions, two collection descriptions, both catalogue-page fallbacks, the
about page and three mock product descriptions - plus, by then, the `Store`
structured data, which made it a machine-readable claim to a search engine.

It came from the Lovable prototype's placeholder copy and survived nine phases.

Removing the word alone would have left "made in limited runs", which is the
same claim, so the copy says what is verifiable instead: a clothing and fabric
shop in Mandi Bahauddin, what it stocks, how it delivers. "What we make" on the
about page is "What we sell".

FOUR "studio" REFERENCES SURVIVED THE FIRST PASS, because the grep was for
"Lahore" and "limited runs": the social strapline, the new-arrivals
description, the order-tracking Processing step and an image alt. Two more said
"pieces are cut in limited runs" in the FAQs and Terms. When removing a claim,
grep for the idea, not the phrase.

Made to order was removed and put straight back. It is a per-product flag the
admin sets, and Terms, Returns, Shipping, FAQs and the PDP all describe it; it
never claimed a studio. Still open: the men's copy says "Cut clean, finished by
hand" in four places, which describes the garment rather than who made it.

**PLACEHOLDER MARKETING COPY IS MORE DANGEROUS THAN A PLACEHOLDER PHONE
NUMBER.** A wrong number is obviously wrong. An invented brand story reads
perfectly, and this one was caught only because it was about to be repeated to
Google.

## The shop is a place, not just a brand

The Google Business Profile went live 2026-09-07 and the site now agrees with
it. `Store` JSON-LD on the homepage carries the address, phone, postcode 50400
and opening hours, and points at the Organization by `@id` so the two do not
read as unrelated businesses sharing an address. `Store` is a `LocalBusiness`,
which is what Google reads for the map pack and near-me results; `Organization`
is the brand behind the website.

Opening hours went in once the DAYS arrived (Saturday to Thursday, 10:00 to
20:00). Friday carries no specification and that is the point - Google reads an
absent day as Closed. The window alone was known for three days and the markup
stayed out, because schema.org requires a `dayOfWeek` and guessing "every day"
would have told Google the shop was open on a day it is shut.

WARNING: **AN ADDRESS IS A SEARCH TERM TO GOOGLE, NOT AN IDENTIFIER.** There
was briefly a `src/lib/maps.ts` that derived the map embed, the directions link
and the listing link from `contact.address`, on the reasonable-sounding grounds
that a location written down twice gets corrected once. It shipped. Google
resolved that string to "K. Khadija & Kumail", Ground Floor Al-Asar Mall - a
different business on a different street, whose name and 4.0 rating rendered on
our own contact page under the heading "Find the shop". The file is deleted.

`googleBusiness` in site.ts now holds three values Google itself produced -
Share to Embed a map, Share to Copy link, and Ask for reviews - and they were
cross-checked against each other before use: all three carry the CID
`0x5a4ab4352acaa893`. The `g.page/r` id is base64url of a protobuf whose first
field is that CID as a little-endian fixed64, so it can be verified offline.
ONE REFERENCE CANNOT CONFIRM ITSELF.

`ShopMap` renders only the parts it has, and nothing at all if it has none. No
"Placeholder:" badge, unlike the legal facts: a missing refund window is
something a customer is owed, but a map or review button announcing itself as
broken just makes the shop look unfinished.

`ReviewPrompt` asks for a review ONLY on a `delivered` order, on /track-order
and the account order detail. A review request is a favour asked of someone
holding the goods; earlier it asks a customer to vouch for a parcel they are
still waiting for. On a cash-on-delivery shop `delivered` also means they have
paid and seen what they paid for. `cancelled` is off that sequence and excluded
by the same check. Deliberately NOT on the confirmation page, the obvious
high-traffic spot: there the customer has a receipt and nothing else.

Every product also has an "Enquire on WhatsApp" link under the buy buttons,
prefilled with the product name and its URL - a customer types "is this
available?" with no indication of which piece, and the shop has to ask before
it can answer. Bordered rather than filled so it does not compete with Add to
bag. Made-to-order pieces do not get it: their primary CTA is already a
WhatsApp enquiry.

## Analytics

Google tag `G-7LDKK13XSX`, installed 2026-09-08 in the root route so it is on
every page including the prerendered ones.

WARNING: **/privacy PROMISED THIS DID NOT EXIST**, in as many words: "There is
no Meta Pixel and no Google Analytics on this site today. If that changes, this
page changes first." So it changed in the same commit. Anything added that sets
a cookie or reports a visitor must do the same - that page is unusual in being
checkable against the source, naming the real localStorage keys and database
columns, and a privacy policy behind the code is worse than none.

One sentence in that new section was wrong and was caught before it shipped: it
said Do Not Track would stop the script. It does not - DNT is a header a site
may ignore, and Google Analytics ignores it. Content blockers do.

WARNING: **PRODUCTION BUILDS ONLY.** `import.meta.env.PROD` is statically
replaced, so in a dev build the branch is eliminated rather than skipped. Local
page views never reach the property, which matters most in its first weeks:
that data is the baseline every later comparison uses, and localhost traffic
cannot be unpicked from it afterwards.

The measurement ID is in committed config, not `.env.local`. It is emitted in
the HTML of every page that loads the tag, so it is public by construction and
nothing can be done with it except send data to this property. It is not a
credential and does not belong beside one.

`trackPurchase` in src/lib/analytics.ts fires GA4 `purchase` from the CHECKOUT
handler, not the confirmation page - that route takes only an order number from
the URL, has no total or items, and can be refreshed. Three things to keep:

- `value` IS THE SERVER'S TOTAL. /api/orders has always returned
  `order.totals.total`; the client simply never declared it. Guardrail 5 makes
  it the only total worth reporting - the cart subtotal excludes delivery, so
  reporting it would make every campaign look less profitable than it was, and
  silently. Verified: a PKR 2,600 order under the free-delivery threshold
  reported 2,850.
- NO EVENT ON THE GATEWAY PATH. A wallet order exists before a rupee has moved,
  which is why /api/orders writes the row first. Reporting there would count
  every abandoned payment as revenue. When a wallet goes live the conversion
  must fire from the gateway callback, which is server-side with no browser and
  so needs the Measurement Protocol, not gtag.
- The cart lines are read BEFORE `clearCart()`, two lines below. Cheap to get
  wrong and silent when it is: the event would fire with an empty basket and
  the revenue figure would still look right.

Every call no-ops when `window.gtag` is absent - dev, SSR, and any visitor
running a content blocker. Verified by deleting `window.gtag` and placing an
order: it completed and threw nothing. An analytics failure must never break
the one page where an exception costs real money.

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
"I paid" can be checked against the gateway's own records. APPLIED — this file
claimed otherwise until 2026-09-08, when `list_migrations` was actually checked.
Every migration 0001-0009 is on the live project.

0009_stock_function_search_path.sql pins an empty `search_path` on both stock
functions and schema-qualifies their bodies, which is what 0003 had already done
for `next_order_number` and 0007 did not repeat. Supabase's linter flagged both.

The risk was small and worth closing anyway. Neither function is SECURITY
DEFINER and execute is granted to `service_role` alone, so nobody could walk
through it today — but that is one word away from being untrue, and on the day
somebody adds SECURITY DEFINER for a plausible reason they will not re-read this
paragraph first.

Verified after applying: the setting is on both, `anon` and `authenticated` are
still refused, and a reserve/release round trip inside a rolled-back transaction
went 4 -> 3 -> 4 and returned NULL when asked for more than the shelf holds —
which is the refusal semantics the whole oversell fix depends on.

**CASH ON DELIVERY IS THE ONLY METHOD OFFERED** as of 2026-09-08. The footer
and checkout listed five, four labelled "Coming soon" - a promise with no date
behind it, on every page. Card and bank transfer had no implementation at all
and are gone outright. The two wallets are UNLISTED, NOT DELETED: they return
the moment their env flag is on, which is what the flag is for.

`PAYMENT_LABELS` is separate from `paymentMethods` for a reason worth keeping.
The offer list shrinks; what a stored `payment_method` MEANS must not, or a past
order shows a customer the raw column value. Both order-detail screens used to
label from the offer list. `paymentLabel()` takes a `string` and returns it
unchanged when unrecognised - the compiler pointed out that an order carries a
plain column value, not the union, which was correct.

## The piece limit was written for suits

`MAX_PIECES` in src/config/filters.ts, raised from 5 to 12 on 2026-09-08. A
comforter set is sold as six, eight or twelve pieces, so Bedsheets could not
describe its own stock: the form input refused the number and the API refused
it again, because the limit was written twice and neither copy knew about the
other.

It replaced a `pieceCounts` list of 1/2/3 that NOTHING IMPORTED - the piece
facet is tallied from products that actually exist, so a hardcoded option list
was never consulted, and had it been it would have hidden every 5-piece suit in
the catalogue.

Expect more of these. Section 16 was written for a clothing shop, and bedding
breaks its assumptions one at a time: sizes (a bed, not an S/M/L), the size
guide (no chest or waist), the possessive heading template, and now piece
counts. When something in Bedsheets looks wrong, check whether the rule behind
it was written for suits.

## Sizes are optional, because most of this shop has none

Unstitched cloth is sold by the length, a dupatta has no size, and a bedsheet's
size is the bed. The admin form nevertheless demanded a size per variant, so
the first real product created through it ended up with a size called "Free".

The product form now asks HOW IS IT SOLD before anything else in that section:

- **One size** (the default for a new product) hides the size column, offers a
  "Sold as" choice of `Unstitched` or `One Size`, and collapses to one row
- **In sizes** is the old table

`sized` is DERIVED, not stored. The database has no column for it and does not
need one: "one size" is already a single variant whose size is one of those two
sentinels, which `src/data/products.ts` has used since Phase 1 and which the
PDP already understands (`needsSize = sizes.length > 1`). A stored flag would be
a second source of truth able to disagree with the variants themselves.

Two things that only surfaced by driving the form:

- The SKU input was `required`, and the browser runs `required` BEFORE any
  submit handler — so in one-size mode, where no size box exists to blur out
  of and nothing auto-filled the SKU, the form could not be submitted at all.
  The handler fills a blank SKU; the server still refuses an empty one.
- `suggestSku` joined its parts unconditionally, so an empty size produced
  "KC-3-PIECE-". Empty segments are dropped now.

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

COLLECTIONS AND BEST SELLER ARE IN THE FORM as of 2026-09-08, added together
because they were the same gap: two homepage sections had been hidden for being
empty and the admin gave no way to fill them. `collectionSlugs` writes
`product_collections`, whose read path had existed since Phase 8 with nothing
able to write it, so every collection was permanently empty. `isBestSeller`
drives the Trending now rail.

Adding both to `ProductInput` made the compiler name every place that had to
change - both repositories, the API, the types, the form, both routes - which
is Phase 8 item 6 doing its job.

Collection slugs are validated against the live list rather than merely cleaned
like tags: a tag is free text, a collection slug is a foreign key, and an
unknown one would otherwise fail deep inside `saveProduct` with a Postgres
constraint message no shopkeeper can act on.

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

## Category cards come from the admin now

The homepage "Shop by category" tiles used to derive their art from the URL:
`/placeholders/category-<slug>-4x5.svg`, hardcoded. Meanwhile `categories`
had an `image_url` column, `saveCategory` wrote it and `toCategory` mapped it
— and NOTHING READ IT. The plumbing existed end to end except for the last
inch.

Now: `/admin/categories` uploads a 4:5 card per category, the homepage loader
reads the taxonomy, and `ShopByCategory` prefers an uploaded card and falls
back to the placeholder.

`uploadCategoryImage` sits beside `uploadProductImage`. Both go through one
`uploadImage(file, shape, folder)`, because the CROP RATIO DIFFERS: products
are 3:4 and category cards 4:5, and uploading one shape into the other's frame
reintroduces exactly the layout shift the fixed frames exist to prevent. Cards
are filed under `category/<slug>/` in the same `product-images` bucket, so one
storage policy covers both.

**Only four of the eight tiles can have an uploaded card.** Women, Men,
Accessories and Bedsheets are rows in `categories`. Unstitched, Ready to Wear,
Bridal and Sale are tag and filter listings with no row to attach a picture
to, so they keep the placeholder. Giving them one means either inventing
category rows that nothing else would use, or a separate "site images" concept
— neither was worth doing on a guess.

Verified by putting a real Storage URL on `women` and rebuilding: that tile
rendered the uploaded webp and the other seven fell back to placeholders.

## The admin works on a phone

Three things did not, and all three were invisible in a desktop screenshot
because nothing overflowed the page — the wide bits sat inside
`overflow-x-auto` and simply scrolled off the right edge.

- **Orders** was a `min-w-[42rem]` table on a 375px screen, so the total and
  the way into an order were both off-screen. Below `md` it is now
  `OrderCard`: number and total on one line, then the customer, a `tel:` link,
  the status, and an Open row. Hard Rule 8 — designed for the phone, not the
  table reflowed.
- **The sizes editor** was `min-w-[620px]`, so the stock box, the field you
  came to change, was off the edge. Below `md` the table stops being a table
  (`block` rows, hidden `thead`, per-cell labels) rather than being duplicated
  as cards, because two copies of six controlled inputs is two places for the
  next change to be made in one of.
- **The admin bar** held four labelled destinations in a non-wrapping flex,
  about 447px of content. It now scrolls horizontally with the labels kept;
  icons alone are not four distinguishable ideas. "View shop" and "Sign out"
  stay pinned so they are never behind a scroll.

`OrderCard` and `AdminNav` are separate components SO THEY CAN BE TESTED. A
route's own component calls `Route.useSearch()` and throws outside its real
match, and the admin layout is behind a guard needing a real Supabase session
— so neither can be rendered in a harness. Presentational pieces can, and were,
at 375px and 1280px.

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
