/**
 * Horizontal product rail. See docs/BUILD-SPEC.pdf Sections 10.2 and 11.1.
 *
 * Uses embla, which is already a dependency. Section 14 forbids a carousel
 * above the fold — this one only ever appears below the hero.
 *
 * It degrades honestly: before embla initialises, the track is a native
 * scroll-snap row, so the rail is usable with no JavaScript at all.
 */

import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import type { Product } from "@/types";
import { ProductCard } from "./ProductCard";

export interface ProductCarouselProps {
  products: Product[];
  /** True only if this rail can appear above the fold. */
  priority?: boolean;
  label: string;
}

export function ProductCarousel({ products, priority = false, label }: ProductCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
    skipSnaps: true,
  });
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const sync = useCallback(() => {
    if (!emblaApi) return;
    setCanPrev(emblaApi.canScrollPrev());
    setCanNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    sync();
    emblaApi.on("select", sync).on("reInit", sync);
    return () => {
      emblaApi.off("select", sync).off("reInit", sync);
    };
  }, [emblaApi, sync]);

  return (
    <div className="relative">
      <div className="overflow-hidden" ref={emblaRef}>
        <ul className="flex gap-4 md:gap-6" aria-label={label}>
          {products.map((product, index) => (
            <li
              key={product.id}
              className="min-w-0 shrink-0 basis-[62%] sm:basis-[38%] lg:basis-[25%] xl:basis-[23%]"
            >
              <ProductCard product={product} priority={priority && index < 2} />
            </li>
          ))}
        </ul>
      </div>

      {/* Arrows are a desktop convenience; touch users swipe. */}
      <div className="pointer-events-none absolute inset-y-0 left-0 right-0 hidden items-center justify-between lg:flex">
        <RailButton
          direction="prev"
          disabled={!canPrev}
          onClick={() => emblaApi?.scrollPrev()}
          label={`Previous ${label}`}
        />
        <RailButton
          direction="next"
          disabled={!canNext}
          onClick={() => emblaApi?.scrollNext()}
          label={`Next ${label}`}
        />
      </div>
    </div>
  );
}

function RailButton({
  direction,
  disabled,
  onClick,
  label,
}: {
  direction: "prev" | "next";
  disabled: boolean;
  onClick: () => void;
  label: string;
}) {
  const Icon = direction === "prev" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={[
        "pointer-events-auto flex h-11 w-11 items-center justify-center bg-kc-white/90 text-kc-ink transition-opacity",
        direction === "prev" ? "-ml-5" : "-mr-5",
        disabled ? "pointer-events-none opacity-0" : "opacity-100",
      ].join(" ")}
      style={{ boxShadow: "var(--shadow-kc)" }}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}
