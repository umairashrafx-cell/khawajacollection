import ProductCard from "./ProductCard";

export function ProductGridSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-[3/4] w-full bg-muted" />
          <div className="mt-3 h-3 w-3/4 bg-muted" />
          <div className="mt-2 h-3 w-1/3 bg-muted" />
        </div>
      ))}
    </div>
  );
}

export default function ProductGrid({ products, columns = 4 }) {
  if (!products.length) {
    return (
      <p className="py-16 text-center text-sm text-muted-foreground">
        No pieces match these filters yet.
      </p>
    );
  }
  return (
    <div
      className={`grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 ${columns === 3 ? "lg:grid-cols-3" : "lg:grid-cols-4"}`}
    >
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
