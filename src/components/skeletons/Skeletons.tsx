/**
 * Loading skeletons. docs/BUILD-SPEC.pdf Phase 9 item 5.
 *
 * These render as a route's `pendingComponent`, which in this app means
 * *client-side navigation only* — the first load is server-rendered with the
 * loader already resolved, so there is nothing to wait for. Tapping from a
 * category into a product is where they actually appear.
 *
 * THE SHAPE MATTERS MORE THAN THE ANIMATION. A skeleton exists to hold the
 * layout still, so the real content lands in the space its placeholder already
 * occupied. One that does not match the page it stands in for causes exactly
 * the layout shift Section 14 budgets against (CLS < 0.05) — it just moves the
 * shift later. So each of these mirrors the real component's grid, its
 * container, and its aspect ratios.
 *
 * `aria-hidden` throughout, with a single polite live region announcing that
 * something is loading. A screen reader gains nothing from twenty grey boxes.
 */

import { Container } from "@/components/layout/Container";

/** One shimmering block. `aspect-[3/4]` is the product ratio, enforced everywhere. */
function Block({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-sm bg-kc-line/60 ${className}`} />;
}

function LoadingAnnouncement({ what }: { what: string }) {
  return (
    <p role="status" aria-live="polite" className="sr-only">
      Loading {what}…
    </p>
  );
}

/** Mirrors ProductGrid at 2 / 3 / 4 columns. */
function GridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }, (_, index) => (
        <div key={index}>
          {/* The 3:4 frame is what stops the grid reflowing when images land. */}
          <Block className="aspect-[3/4] w-full" />
          <Block className="mt-3 h-3.5 w-4/5" />
          <Block className="mt-2 h-3.5 w-1/3" />
        </div>
      ))}
    </div>
  );
}

/** Category and collection pages — mirrors CatalogPage's header + sidebar + grid. */
export function CatalogSkeleton() {
  return (
    <div aria-hidden="true">
      <LoadingAnnouncement what="products" />

      <Container>
        <div className="pt-8 pb-8 lg:pt-10 lg:pb-10">
          <Block className="h-3 w-48" />
          <Block className="mt-4 h-9 w-2/3 max-w-sm md:h-11" />
          <Block className="mt-3 h-4 w-full max-w-2xl" />
        </div>
      </Container>

      <Container>
        <div className="flex gap-10 pb-12 lg:pb-20">
          <aside className="hidden w-[280px] shrink-0 lg:block">
            <Block className="h-6 w-24" />
            <div className="mt-4 space-y-6">
              {Array.from({ length: 4 }, (_, index) => (
                <div key={index}>
                  <Block className="h-4 w-28" />
                  <div className="mt-3 space-y-2">
                    <Block className="h-3 w-full" />
                    <Block className="h-3 w-5/6" />
                    <Block className="h-3 w-4/6" />
                  </div>
                </div>
              ))}
            </div>
          </aside>

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between border-b border-kc-line pb-4">
              <Block className="h-4 w-40" />
              <Block className="h-4 w-24" />
            </div>
            <div className="mt-6">
              <GridSkeleton />
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}

/** Product detail — gallery on the left, buy column on the right. */
export function ProductSkeleton() {
  return (
    <div aria-hidden="true">
      <LoadingAnnouncement what="this product" />

      <Container>
        <div className="py-6">
          <Block className="h-3 w-56" />
        </div>

        <div className="grid gap-8 pb-16 lg:grid-cols-2 lg:gap-12">
          <div>
            <Block className="aspect-[3/4] w-full" />
            <div className="mt-3 hidden gap-3 lg:flex">
              {Array.from({ length: 4 }, (_, index) => (
                <Block key={index} className="aspect-[3/4] w-20" />
              ))}
            </div>
          </div>

          <div className="lg:pt-2">
            <Block className="h-3 w-24" />
            <Block className="mt-3 h-8 w-4/5 md:h-10" />
            <Block className="mt-4 h-7 w-32" />
            <Block className="mt-5 h-4 w-full" />
            <Block className="mt-2 h-4 w-5/6" />

            <div className="mt-8 space-y-3">
              <Block className="h-3 w-20" />
              <div className="flex gap-2">
                {Array.from({ length: 4 }, (_, index) => (
                  <Block key={index} className="h-11 w-11 rounded-full" />
                ))}
              </div>
            </div>

            <div className="mt-7 space-y-3">
              <Block className="h-3 w-16" />
              <div className="flex gap-2">
                {Array.from({ length: 5 }, (_, index) => (
                  <Block key={index} className="h-11 w-14" />
                ))}
              </div>
            </div>

            <Block className="mt-8 h-12 w-full" />
            <Block className="mt-3 h-12 w-full" />
          </div>
        </div>
      </Container>
    </div>
  );
}

/** Homepage and the editorial landing pages: a hero, then rows of products. */
export function PageSkeleton() {
  return (
    <div aria-hidden="true">
      <LoadingAnnouncement what="the page" />

      <Block className="h-[380px] w-full rounded-none md:h-[520px]" />

      <Container>
        <div className="py-12 lg:py-16">
          <Block className="h-7 w-56" />
          <div className="mt-8">
            <GridSkeleton count={4} />
          </div>
        </div>
      </Container>
    </div>
  );
}

/** Search results — no sidebar, and the query echo sits above the grid. */
export function SearchSkeleton() {
  return (
    <div aria-hidden="true">
      <LoadingAnnouncement what="search results" />

      <Container>
        <div className="py-10">
          <Block className="h-8 w-64" />
          <Block className="mt-3 h-4 w-40" />
          <div className="mt-8">
            <GridSkeleton />
          </div>
        </div>
      </Container>
    </div>
  );
}
