/**
 * Shop by Category. See docs/BUILD-SPEC.pdf Section 11.1 item 3.
 *
 * Eight 4:5 cards. Horizontal scroll on mobile, 4x2 grid from md up — a
 * separate mobile layout, not the desktop grid squeezed (Rule 8).
 *
 * FOUR COLUMNS RATHER THAN THREE because the strip now carries eight tiles;
 * at three it would be 3+3+2 and end on two holes. The count and the column
 * count have to stay divisible — if a ninth is ever added, this goes back to
 * three columns, not to 4+4+1.
 */

import { Image } from "@/components/media/Image";
import { AppLink } from "@/components/layout/AppLink";
import { shopByCategory } from "@/config/nav";

/**
 * The card for a tile: whatever the admin uploaded, else the generated
 * placeholder.
 *
 * FOUR OF THE EIGHT TILES CAN HAVE AN UPLOADED CARD and four cannot, which is
 * worth knowing before wondering why. Women, Men, Accessories and Bedsheets
 * are rows in the `categories` table and can therefore hold an image_url.
 * Unstitched, Ready to Wear, Bridal and Sale are not categories at all — they
 * are tag and filter listings — so there is no row to attach a picture to, and
 * they keep the placeholder until something gives them one.
 */
function cardImage(href: string, uploaded: string | undefined) {
  const slug = href.replace(/^\//, "");
  return {
    src: uploaded ?? `/placeholders/category-${slug}-4x5.svg`,
    width: 960,
    height: 1200,
  };
}

export function ShopByCategory({ cards = {} }: { cards?: Record<string, string> }) {
  return (
    <ul
      className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-4 md:gap-x-4 md:gap-y-6 lg:gap-6 md:overflow-visible md:px-0 md:pb-0"
      aria-label="Shop by category"
    >
      {shopByCategory.map((category) => {
        const image = cardImage(category.href, cards[category.href.replace(/^\//, "")]);
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
                  sizes="(min-width: 768px) 25vw, 62vw"
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
