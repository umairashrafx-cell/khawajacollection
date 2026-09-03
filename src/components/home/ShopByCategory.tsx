/**
 * Shop by Category. See docs/BUILD-SPEC.pdf Section 11.1 item 3.
 *
 * Six 4:5 cards. Horizontal scroll on mobile, 3x2 grid on desktop — a
 * separate mobile layout, not the desktop grid squeezed (Rule 8).
 */

import { Image } from "@/components/media/Image";
import { AppLink } from "@/components/layout/AppLink";
import { shopByCategory } from "@/config/nav";

/** Card art is generated locally; see scripts/generate-placeholders.mjs. */
function cardImage(href: string) {
  const slug = href.replace(/^\//, "");
  return {
    src: `/placeholders/category-${slug}-4x5.svg`,
    width: 960,
    height: 1200,
  };
}

export function ShopByCategory() {
  return (
    <ul
      className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:px-0 md:pb-0"
      aria-label="Shop by category"
    >
      {shopByCategory.map((category) => {
        const image = cardImage(category.href);
        return (
          <li
            key={category.href}
            className="w-[62%] shrink-0 snap-start sm:w-[42%] md:w-auto md:shrink"
          >
            <AppLink href={category.href} className="group block">
              <div className="overflow-hidden bg-kc-sand">
                <Image
                  src={image.src}
                  alt={`${category.label} at Khawaja Collection`}
                  width={image.width}
                  height={image.height}
                  sizes="(min-width: 768px) 33vw, 62vw"
                  className="aspect-[4/5] w-full object-cover"
                />
              </div>
              <p className="mt-3 text-sm font-medium text-kc-ink transition-colors group-hover:text-kc-gold">
                {category.label}
              </p>
            </AppLink>
          </li>
        );
      })}
    </ul>
  );
}
