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
> - **ISR** → nitro route cache rules / stale-while-revalidate headers (Phase 9).
> - **`generateStaticParams`** → TanStack prerender in `vite.config.ts`
>   (done in Phase 5). It crawls from `/` and writes 88 static HTML files,
>   including all 60 PDPs.
> - **`next/font`** → fonts are on the Google CDN with `display: swap` today;
>   self-host and subset to latin in Phase 9.
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
- [ ] **Phase 7** — Checkout, orders, tracking
- [ ] **Phase 8** — Supabase migration
- [ ] **Phase 9** — SEO, performance, a11y, launch

## Known debt from the Lovable prototype

Phase 6 removed the prototype data/state layer entirely: `src/context/ShopContext.jsx`,
`src/components/shop/`, `src/lib/legacy-shop-adapter.ts` and the prototype
`cart` / `wishlist` / `search` routes are all deleted. What is left:

- `src/data/legacy/*.js` (16 products, no variants) still backs
  `src/services/catalogService.js`, which now only serves `sitemap[.]xml.jsx`.
  Phase 9 rebuilds the sitemap from the repository and both can go.
- `src/routes/checkout.jsx`, `account.jsx`, `track-order.jsx` are still
  Lovable-era JavaScript. They read the typed stores now, but Phase 7 rebuilds
  checkout and tracking properly.
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
