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
> - **`generateStaticParams`** → TanStack prerender config over
>   `productRepository.getAllSlugs()` (Phase 5).
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
- [ ] **Phase 2** — Layout shell: AnnouncementBar, Header, MegaMenu, MobileNav, Footer
- [ ] **Phase 3** — ProductCard + homepage (12 sections)
- [ ] **Phase 4** — PLP, filters, sorting, pagination
- [ ] **Phase 5** — PDP
- [ ] **Phase 6** — Cart, wishlist, search
- [ ] **Phase 7** — Checkout, orders, tracking
- [ ] **Phase 8** — Supabase migration
- [ ] **Phase 9** — SEO, performance, a11y, launch

## Known debt from the Lovable prototype

The prototype under `src/components/{home,shop}`, `src/context/ShopContext.jsx`,
`src/data/*.js` and `src/services/*.js` predates the spec. It is a visual
reference and component donor, not the target architecture. It gets replaced
phase by phase:

- `src/data/legacy/*.js` (16 products, no variants) → superseded by `src/data/*.ts`;
  delete once no prototype file imports it
- `src/services/catalogService.js` → superseded by `src/lib/repositories/`;
  still backs the prototype routes until Phases 2-6 rewrite them
- `src/context/ShopContext.jsx` (Context API) → Phase 6 Zustand stores
  (`zustand` is **not installed yet** — ask before adding it)
- `src/components/shop/*` → splits into `product/`, `catalog/`, `cart/`, `search/`
- `src/routes/category.$slug.jsx`, `product.$slug.jsx` → Phase 4/5 spec routes
  (`/women`, `/men`, `/products/$slug`, …), with 301s from the old paths
