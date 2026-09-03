# Khawaja Collection (KC)

A premium, mobile-first Pakistani fashion storefront: editorial home page, category listing with
filters and sort, rich product pages, wishlist, cart drawer, mock checkout (COD / card / bank
transfer), order tracking and account screens.

## Tech

- React 19 + Vite
- TanStack Start / TanStack Router (file-based routing, SSR and SEO metadata)
- Tailwind CSS v4 (design tokens in `src/styles.css`)
- Context API for cart + wishlist state, `sonner` for toasts, `lucide-react` for icons
- Application code is plain JavaScript / JSX

## Run locally

```bash
bun install     # or npm install
bun run dev     # http://localhost:8080
bun run build   # production build
```

## Folder structure

```
src/
  assets/        images
  components/
    home/        hero, category tiles, editorial, newsletter, social strip
    layout/      announcement bar, header, mega menu, mobile nav, footer, page shell
    shop/        product card/grid, gallery, accordions, filters, cart drawer, search
    ui/          shadcn primitives
  context/       ShopContext.jsx — cart, wishlist, drawer + search state (localStorage backed)
  data/          products.js, categories.js, promos.js — all business content lives here
  lib/           formatting helpers
  routes/        file-based routes (see below)
  services/      catalogService.js, orderService.js — the only data access layer
```

Components stay small (under ~150 lines) and read data through the services layer, never from
`src/data` directly, so the mock arrays can be swapped for a database or admin API by editing
`src/services/*` only.

## Routes

| Path                 | Screen                                                                               |
| -------------------- | ------------------------------------------------------------------------------------ |
| `/`                  | Home: hero, categories, new arrivals, trending, editorials, sale, social, newsletter |
| `/category/$slug`    | Product listing with size/colour/fabric/price filters and sort                       |
| `/product/$slug`     | Product page: gallery, sizes, accordions, sticky mobile add-to-bag                   |
| `/search?q=`         | Search results (header overlay gives live suggestions)                               |
| `/wishlist`          | Guest wishlist stored on device, auth-ready                                          |
| `/cart`, `/checkout` | Bag and mock checkout (COD / card / bank transfer)                                   |
| `/track-order?id=`   | Order status timeline                                                                |
| `/account`           | Order history, wishlist summary, sign-in placeholder                                 |
| `/sitemap.xml`       | Generated from the catalogue                                                         |

## Data model (ready for a backend)

- **Products**: id, slug, category, subCategory, price, compareAtPrice, fabric, colour, sizes with
  stock flags, tags, images, SKU, rating.
- **Categories**: parent categories with children, used for nav, mega menu and PLP filters.
- **Orders**: created via `orderService.placeOrder`, persisted to `localStorage` today; each
  function is async and returns plain objects so it can be swapped for API calls.
- **Promos / shipping**: `src/data/promos.js` (announcements, hero copy, promo codes, payment
  methods, free-shipping threshold).

No secrets or credentials are used anywhere; the checkout is a demo and processes no payments.

## SEO

Per-route `head()` metadata (title, description, OG, canonical), Store and Product JSON-LD,
`robots.txt`, generated `sitemap.xml`, semantic headings, alt text and lazy-loaded imagery.
