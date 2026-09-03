/**
 * The wishlist heart. See docs/BUILD-SPEC.pdf Sections 10.1, 6.5 and 15.
 *
 * Layered above the card link, so it stops the click from navigating.
 *
 * TAP TARGET — reconciling two spec lines. Section 10.1 asks for a 36px
 * target; Section 15 requires >= 44x44 on mobile and names the wishlist heart
 * as "the usual offender". Both are satisfied by 44px on touch widths and 36px
 * from `md` up, where a mouse makes the smaller target fine.
 */

import { useCallback, useState } from "react";
import { Heart } from "lucide-react";

import { announce } from "@/store/announcer";
import { toggleWishlist, useIsWishlisted, useWishlistHydrated } from "@/store/wishlist-store";
import type { Product } from "@/types";

export interface WishlistButtonProps {
  product: Product;
  className?: string;
}

export function WishlistButton({ product, className = "" }: WishlistButtonProps) {
  const hydrated = useWishlistHydrated();
  const wishlisted = useIsWishlisted(product.id);
  const [pulsing, setPulsing] = useState(false);

  // Reads false until the persisted store hydrates, so the server and client
  // render the same heart and nothing flickers or mismatches.
  const saved = hydrated && wishlisted;

  const onClick = useCallback(
    (event: React.MouseEvent) => {
      // The whole card is a link; this button sits on top of it.
      event.preventDefault();
      event.stopPropagation();
      const nowSaved = toggleWishlist(product);
      announce(
        nowSaved
          ? `${product.name} saved to your wishlist.`
          : `${product.name} removed from your wishlist.`,
      );
      // Section 6.5 — a single 180ms scale pulse.
      setPulsing(true);
      window.setTimeout(() => setPulsing(false), 180);
    },
    [product],
  );

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={saved}
      aria-label={
        saved ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`
      }
      className={`flex h-11 w-11 items-center justify-center md:h-9 md:w-9 ${className}`}
    >
      <Heart
        className={[
          "h-[18px] w-[18px] transition-[transform,fill,color] duration-[180ms]",
          saved ? "fill-kc-sale text-kc-sale" : "text-kc-ink",
          pulsing ? "scale-[1.18]" : "scale-100",
        ].join(" ")}
        aria-hidden="true"
      />
    </button>
  );
}
