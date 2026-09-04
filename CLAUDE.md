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
- [x] **Phase 1** — Data layer: `ProductRepository`, 60 mock products, placeholder image script
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

## Known debt from the Lovable prototype

Phase 6 removed the prototype data/state layer entirely: `src/context/ShopContext.jsx`,
`src/components/shop/`, `src/lib/legacy-shop-adapter.ts` and the prototype
`cart` / `wishlist` / `search` routes are all deleted. What is left:

- `src/data/legacy/*.js` (16 products, no variants) still backs
  `src/services/catalogService.js`, which now only serves `sitemap[.]xml.jsx`.
  Phase 9 rebuilds the sitemap from the repository and both can go.
- Phase 7 rebuilt checkout, account, tracking and order confirmation in
  TypeScript and deleted `src/services/orderService.js`. The only Lovable-era
  JavaScript left is `src/services/catalogService.js` and `src/data/legacy/`,
  which now serve `sitemap[.]xml.jsx` alone.

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
