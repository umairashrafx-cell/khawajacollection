# Khawaja Collection — Launch Checklist

Everything standing between the current `main` and a live shop, in the order it
should be done. Written at the end of Phase 9 (spec item 6).

Two rules held throughout the build shape this list:

- **Hard Rule 9 / Guardrail 2** — no phone number, address, price, delivery
  timeline, refund window or social URL was ever invented. Every one that is
  still unknown is a `PLACEHOLDER` in `src/config/site.ts` or a visible
  `Placeholder: …` marker on the page. That is why section 3 below is long: it
  is the honest cost of not making things up.
- **Nothing ships a business commitment nobody agreed to.** Several items below
  block launch outright rather than merely degrading the site.

---

## 0. Blockers — the site must not take real orders until these are done

| # | Item | Why it blocks |
|---|------|---------------|
| 0.1 | **Rotate the Supabase `service_role` key** and set `SUPABASE_SERVICE_ROLE_KEY` on the host | The previous key was pasted into a chat transcript and must be considered compromised. Until a key is set, every server-side order path fails closed with a 503 — no order can be placed. |
| 0.2 | **Set `commerce.flatShippingRate`** in `src/config/site.ts` | It is `null`. `/api/orders` deliberately refuses any order below the free-delivery threshold rather than charge a made-up amount, so today only orders over PKR 5,000 can be placed at all. |
| 0.3 | **Set `VITE_PRODUCT_REPOSITORY=supabase`** on the host | The default is `mock`, and under `mock` orders live in a module-level Map that does not survive a serverless cold start. A placed order would usually be invisible to tracking. |
| 0.4 | **Legal review of `/terms`, `/privacy`, `/refund-policy`** | They are written from what the software actually does, but the legal identity, jurisdiction and retention periods are placeholders, and none of it has been reviewed by a lawyer. |

---

## 1. Environment variables

Set on Vercel (and anywhere else the app runs). Everything prefixed `VITE_` is
**inlined into the client bundle and is public** — that prefix is the security
boundary.

| Variable | Public? | Notes |
|---|---|---|
| `VITE_SITE_URL` | public | The production origin, e.g. `https://khawajacollection.com`. Canonicals, Open Graph URLs and the sitemap all depend on it. Until it is set, canonicals fall back to root-relative paths — legal, but it also means the `sameAs`/`url` fields are omitted from the Organization JSON-LD. |
| `VITE_SUPABASE_URL` | public | Project URL. |
| `VITE_SUPABASE_ANON_KEY` | public | The **publishable** key. Safe in the browser by design; everything it can reach is governed by RLS. |
| `VITE_PRODUCT_REPOSITORY` | public | `supabase` in production. See blocker 0.3. |
| `SUPABASE_SERVICE_ROLE_KEY` | **SERVER ONLY** | Bypasses RLS entirely. **Never** give this a `VITE_` prefix. See blocker 0.1. |

- [ ] All five set in Vercel → Project → Settings → Environment Variables
- [ ] Set for Production **and** Preview (a preview build with no Supabase silently serves the mock repository)
- [ ] Redeploy after setting them — Vite inlines `VITE_*` at build time, so changing one without rebuilding changes nothing

## 2. Domain and hosting

- [ ] `khawajacollection.com` pointed at Vercel, `www` redirecting to the apex (or vice versa — pick one and make the other a 301)
- [ ] HTTPS certificate issued and forced
- [ ] Confirm the deployment actually serves the app. `vercel.json` + `scripts/finalize-vercel-output.mjs` exist because a previous deploy 404'd: the Lovable wrapper relocates nitro's output and drops the Build Output API config. If the site 404s again, that is the first place to look.
- [ ] Check `/robots.txt` and `/sitemap.xml` both answer on the real domain

## 3. Business facts still to supply

Each of these renders today as a visible `Placeholder: …` marker on the page, or
is omitted entirely. Grep for `PLACEHOLDER` in `src/config/site.ts` and for
`<TBC` in `src/routes/`.

### Contact — `src/config/site.ts`, `contact`
- [ ] `whatsapp` — the floating WhatsApp button and the PDP "Enquire" CTA stay inert until this is real
- [ ] `supportEmail` — omitted from the footer, contact page and PDP accordions
- [ ] `address` — studio address, shown on `/contact` and `/about`
- [ ] `hours` — opening hours

### Commerce — `src/config/site.ts`, `commerce`
- [ ] `flatShippingRate` — **blocks orders under PKR 5,000** (blocker 0.2)
- [ ] `deliveryEstimate` — e.g. `"3–5 working days"`. Shown on `/shipping`, `/faqs` and the PDP trust row
- [ ] `exchangeWindow` — e.g. `"7 days from delivery"`. Shown on `/returns` and `/faqs`

### Social — `src/config/site.ts`, `social`
- [ ] `instagram` — currently `#`, so the link is filtered out of the footer and the social grid
- [ ] `tiktok` — same
- Facebook is already set and is the only live profile

### Legal — the content pages
- [ ] Registered business name and address (`/terms`, `/privacy`)
- [ ] Governing jurisdiction and courts (`/terms`)
- [ ] Order-data retention period (`/privacy`)
- [ ] Refund processing time (`/refund-policy`)
- [ ] Effective / last-updated dates on all three policy pages

## 4. Assets Umair must supply (spec Section 19)

- [ ] **KC logo** — SVG, plus a monochrome version for the footer and a square mark for favicon/OG
- [ ] **Favicon** — `public/favicon.ico` is still the Lovable default
- [ ] **Open Graph card** — `public/og/khawaja-collection.png` is generated scaffolding (`npm run og-image`): a KC monogram drawn from geometry, no real logo. Replace with the real 1200×630 card and delete `scripts/generate-og-image.mjs`
- [ ] **Hero imagery** — 2–3 editorial shots, min 2400px wide, one portrait crop for mobile
- [ ] **Product photography** — minimum 3 images per product, consistent background, 3:4 crop. Every product image on the site today is a generated SVG placeholder. This is the single biggest quality lever on the whole site.
- [ ] Once real images exist, re-check the Section 14 hero budget (< 180 KB transferred, AVIF/WebP, responsive `srcset`)

## 5. Search Console and analytics

- [ ] Add the property in Google Search Console and verify it (DNS TXT is the least fragile method)
- [ ] Submit `https://<domain>/sitemap.xml`
- [ ] Confirm Search Console reports no "Submitted URL blocked by robots.txt" — the sitemap and `robots.txt` are built from the same list of public routes precisely to avoid this
- [ ] Watch for 404s on the legacy `/category/*` and `/product/*` URLs. They 301 to the new locations; `src/routes/category.$slug.tsx` and `product.$slug.tsx` can be deleted once those stop appearing
- [ ] **GA4 slot** — nothing is installed. `/privacy` currently states plainly that no analytics or advertising script is loaded. **If you add GA4, update that page in the same commit.**
- [ ] **Meta Pixel slot** — same. Nothing installed, and `/privacy` says so

## 6. Reviews

- [ ] `hasRealReviews` in `src/config/site.ts` is `false`, which hides the PDP star rating and omits `AggregateRating` from the Product JSON-LD.
- [ ] **Do not flip it to `true` until reviews are genuinely collected from buyers.** The ratings in the catalogue are generated values; publishing them as structured data is fabricated review markup, which earns a manual action rather than a ranking penalty.

## 6b. Measured at the end of Phase 9

Lighthouse 12, mobile preset, against a `node-server` production build on this
machine. Reproduce with:

```bash
NITRO_PRESET=node-server npm run build && node .output/server/index.mjs
```

| Page | Performance | Accessibility | Best Practices | SEO | LCP |
|---|---|---|---|---|---|
| Home | 70 | 100 | 100 | 100 | 5.2s |
| `/women` | 74 | 100 | 100 | 100 | 4.6s |
| Product | 86 | 100 | 100 | 100 | 3.4s |

Section 14 budget, measured from the build output:

- Homepage JS, gzipped: **158 KB** against a 180 KB budget — within spec.
- CLS: **0.001 / 0 / 0** against a 0.05 budget — within spec.
- Hero image transferred: **111 KB** against a 180 KB budget — within spec on
  bytes, but it is a JPEG with no AVIF/WebP variants and no responsive srcset.

### Performance is short of the >= 90 target, and this is why

LCP is the binding constraint on all three pages, and on every one of them the
LCP element is **placeholder imagery** — a stock hero JPEG on the homepage,
generated SVGs in the product grids. Section 14 asks for AVIF/WebP with a
responsive srcset; the `<Image>` component already accepts `sources` and
`srcSet` and passes neither today, because the placeholders have no raster
variants to offer.

Producing those variants needs an image-processing dependency (`sharp` or
equivalent), which Hard Rule 7 forbids adding without asking. **This is a
decision for Umair**, and it is bundled with the real photography anyway:

- [ ] Decide whether to add `sharp` and generate AVIF/WebP + srcset at build time
- [ ] Re-run Lighthouse after the real photography lands and after deploying to
      Vercel — a CDN with HTTP/2, edge caching and real latency is not the same
      measurement as a local Node server, and the numbers above should not be
      treated as final until it is repeated there

## 7. Pre-flight verification

Run against the production build (`NITRO_PRESET=node-server npm run build && node .output/server/index.mjs`), not the dev server.

- [ ] `npx tsc --noEmit` clean
- [ ] `npm run lint` clean
- [ ] `npm run build` passes
- [ ] Place a real order end to end and confirm it appears in Supabase `orders` and in `/track-order`
- [ ] Create an account, add to the wishlist as a guest first, then sign in and confirm the guest items survive the merge
- [ ] Check the site at 360 / 768 / 1024 / 1440
- [ ] Keyboard-only pass: nav, mega menu, filters, gallery, checkout. Escape closes every overlay
- [ ] Lighthouse on the homepage, a category page and a product page — mobile Performance ≥ 90 and SEO = 100 before calling it done

## 8. After launch

- [ ] Watch the first few real orders land in Supabase rather than assuming
- [ ] Check Search Console coverage after a week
- [ ] Delete the legacy redirect routes once the old URLs stop being requested
- [ ] `src/data/legacy/promos.js` still backs three homepage components. It is editorial copy, not product data, and should be folded into the repository or into config when the real copy arrives
