import { Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { useShop } from "@/context/ShopContext";
import { formatPrice, discountPercent } from "@/lib/format";

export default function ProductCard({ product }) {
  const { toggleWishlist, isWishlisted } = useShop();
  const off = discountPercent(product.price, product.compareAtPrice);
  const saved = isWishlisted(product.id);

  return (
    <article className="group relative">
      <Link
        to="/product/$slug"
        params={{ slug: product.slug }}
        className="block overflow-hidden bg-sand"
      >
        <img
          src={product.images[0]}
          alt={product.name}
          loading="lazy"
          width={900}
          height={1200}
          className="aspect-[3/4] w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
        />
      </Link>

      {off && (
        <span className="absolute left-3 top-3 bg-background px-2 py-1 text-[10px] uppercase tracking-[0.16em]">
          {off}% off
        </span>
      )}

      <button
        onClick={() => toggleWishlist(product)}
        aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
        aria-pressed={saved}
        className="absolute right-2 top-2 rounded-full bg-background/85 p-2 backdrop-blur transition-colors hover:bg-background"
      >
        <Heart className={`h-4 w-4 ${saved ? "fill-gold text-gold" : "text-foreground"}`} />
      </button>

      <div className="pt-3">
        <Link to="/product/$slug" params={{ slug: product.slug }} className="text-sm leading-snug">
          {product.name}
        </Link>
        <p className="mt-1 text-xs text-muted-foreground">{product.fabric}</p>
        <p className="mt-1.5 flex items-baseline gap-2 text-sm">
          <span>{formatPrice(product.price)}</span>
          {product.compareAtPrice && (
            <span className="text-xs text-muted-foreground line-through">
              {formatPrice(product.compareAtPrice)}
            </span>
          )}
        </p>
      </div>
    </article>
  );
}
