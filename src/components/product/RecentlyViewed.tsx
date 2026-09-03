/**
 * Recently Viewed rail. See docs/BUILD-SPEC.pdf Section 11.3.
 *
 * Reads from localStorage, so it renders nothing on the server and appears
 * after hydration — which is correct here: it is per-device history, not
 * catalogue content, and it must never differ between server and client markup
 * (Section 12).
 */

import { AppLink } from "@/components/layout/AppLink";
import { Image } from "@/components/media/Image";
import { SectionHeader } from "@/components/home/SectionHeader";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { formatPKR } from "@/lib/format";
import type { Product } from "@/types";

export function RecentlyViewed({ product }: { product: Product }) {
  const entries = useRecentlyViewed(product);

  if (entries.length === 0) return null;

  return (
    <section>
      <SectionHeader eyebrow="On this device" title="Recently viewed" />
      <ul className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 md:mx-0 md:grid md:grid-cols-6 md:gap-6 md:overflow-visible md:px-0">
        {entries.slice(0, 6).map((entry) => (
          <li key={entry.slug} className="w-[38%] shrink-0 snap-start md:w-auto">
            <AppLink href={`/products/${entry.slug}`} className="group block">
              <div className="overflow-hidden bg-kc-sand">
                <Image
                  src={entry.image}
                  alt={entry.alt}
                  width={900}
                  height={1200}
                  sizes="(min-width: 768px) 16vw, 38vw"
                  className="aspect-[3/4] w-full object-cover"
                />
              </div>
              <h3 className="mt-2 line-clamp-2 text-[13px] leading-snug text-kc-ink">
                {entry.name}
              </h3>
              <p className="kc-price mt-1 text-[13px] font-semibold">{formatPKR(entry.price)}</p>
            </AppLink>
          </li>
        ))}
      </ul>
    </section>
  );
}
