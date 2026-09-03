import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, Truck, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import PageContainer from "@/components/layout/PageContainer";
import ProductGallery from "@/components/shop/ProductGallery";
import ProductAccordions from "@/components/shop/ProductAccordions";
import ProductGrid from "@/components/shop/ProductGrid";
import { SectionHeader } from "@/components/home/SectionHeader";
import { getProduct, getRelated } from "@/services/catalogService";
import { useShop } from "@/context/ShopContext";
import { formatPrice, discountPercent } from "@/lib/format";

export const Route = createFileRoute("/product/$slug")({
  loader: async ({ params }) => {
    const product = await getProduct(params.slug);
    if (!product) return { product: null, related: [] };
    return { product, related: await getRelated(product) };
  },
  head: ({ params, loaderData }) => {
    const p = loaderData?.product;
    if (!p)
      return {
        meta: [
          { title: "Product unavailable — Khawaja Collection" },
          { name: "robots", content: "noindex" },
        ],
      };
    const title = `${p.name} — Khawaja Collection`;
    return {
      meta: [
        { title },
        { name: "description", content: p.description.slice(0, 155) },
        { property: "og:title", content: title },
        { property: "og:description", content: p.description.slice(0, 155) },
        { property: "og:type", content: "product" },
        { property: "og:url", content: `/product/${params.slug}` },
      ],
      links: [{ rel: "canonical", href: `/product/${params.slug}` }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: p.name,
            sku: p.sku,
            description: p.description,
            brand: { "@type": "Brand", name: "Khawaja Collection" },
            offers: {
              "@type": "Offer",
              price: p.price,
              priceCurrency: "PKR",
              availability: "https://schema.org/InStock",
            },
          }),
        },
      ],
    };
  },
  component: ProductPage,
});

function ProductPage() {
  const { product, related } = Route.useLoaderData();
  const { addToCart, toggleWishlist, isWishlisted } = useShop();
  const [size, setSize] = useState(null);

  useEffect(() => setSize(null), [product?.id]);

  if (!product) {
    return (
      <PageContainer className="py-24 text-center">
        <h1 className="font-serif text-2xl">This piece is no longer available</h1>
        <Link
          to="/"
          className="mt-6 inline-block border-b border-foreground pb-1 text-xs uppercase tracking-[0.2em]"
        >
          Back home
        </Link>
      </PageContainer>
    );
  }

  const off = discountPercent(product.price, product.compareAtPrice);
  const saved = isWishlisted(product.id);

  const add = () => {
    if (product.sizes.length > 1 && !size) {
      toast.error("Please select a size");
      return;
    }
    addToCart(product, { size: size ?? product.sizes[0].label });
  };

  return (
    <>
      <PageContainer>
        <nav aria-label="Breadcrumb" className="pt-6 text-xs text-muted-foreground">
          <Link to="/">Home</Link> <span className="mx-2">/</span>
          <Link to="/category/$slug" params={{ slug: product.category }}>
            {product.category}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{product.name}</span>
        </nav>

        <div className="grid gap-10 py-8 lg:grid-cols-2 lg:gap-16">
          <ProductGallery images={product.images} name={product.name} />

          <div className="pb-24 lg:pb-0">
            <h1 className="font-serif text-2xl sm:text-3xl">{product.name}</h1>
            <p className="mt-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
              {product.fabric} · {product.colour}
            </p>
            <p className="mt-4 flex items-baseline gap-3">
              <span className="text-xl">{formatPrice(product.price)}</span>
              {product.compareAtPrice && (
                <>
                  <span className="text-sm text-muted-foreground line-through">
                    {formatPrice(product.compareAtPrice)}
                  </span>
                  <span className="text-xs text-gold">{off}% off</span>
                </>
              )}
            </p>
            <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
              {product.description}
            </p>

            <div className="mt-7">
              <p className="mb-3 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                Size
              </p>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s) => (
                  <button
                    key={s.label}
                    disabled={!s.inStock}
                    onClick={() => setSize(s.label)}
                    aria-pressed={size === s.label}
                    className={`min-w-12 border px-3 py-2 text-xs transition-colors disabled:opacity-35 ${
                      size === s.label
                        ? "border-foreground bg-foreground text-background"
                        : "border-border hover:border-gold"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-7 hidden gap-3 lg:flex">
              <button
                onClick={add}
                className="flex-1 bg-foreground py-3.5 text-[11px] uppercase tracking-[0.22em] text-background"
              >
                Add to bag
              </button>
              <button
                onClick={() => toggleWishlist(product)}
                aria-label="Save to wishlist"
                className="border border-border px-4"
              >
                <Heart className={`h-5 w-5 ${saved ? "fill-gold text-gold" : ""}`} />
              </button>
            </div>

            <ul className="mt-7 space-y-2 text-xs text-muted-foreground">
              <li className="flex items-center gap-2">
                <Truck className="h-4 w-4" /> Free delivery over PKR 5,000 · Cash on delivery
                available
              </li>
              <li className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" /> Easy 7-day exchange
              </li>
            </ul>

            <ProductAccordions product={product} />
          </div>
        </div>

        {related.length > 0 && (
          <section className="pb-20">
            <SectionHeader eyebrow="Complete the look" title="You may also like" />
            <ProductGrid products={related} />
          </section>
        )}
      </PageContainer>

      <div className="fixed inset-x-0 bottom-0 z-30 flex gap-3 border-t border-border bg-background p-3 lg:hidden">
        <button
          onClick={() => toggleWishlist(product)}
          aria-label="Save to wishlist"
          className="border border-border px-4"
        >
          <Heart className={`h-5 w-5 ${saved ? "fill-gold text-gold" : ""}`} />
        </button>
        <button
          onClick={add}
          className="flex-1 bg-foreground py-3.5 text-[11px] uppercase tracking-[0.22em] text-background"
        >
          Add to bag · {formatPrice(product.price)}
        </button>
      </div>
    </>
  );
}
