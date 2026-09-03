/**
 * PDP gallery. See docs/BUILD-SPEC.pdf Sections 10.2 and 11.3.
 *
 * Desktop: a vertical thumbnail rail beside the main image, which zooms on
 * click. Mobile: a swipeable full-bleed carousel with dot indicators.
 *
 * "Never a lightbox library" (Section 10.2). Zoom is a scale transform with
 * transform-origin set to the click point, so a click magnifies the spot you
 * pointed at and a second click returns. No dependency, nothing to trap focus.
 */

import { useRef, useState } from "react";

import { Image } from "@/components/media/Image";
import type { ProductImage } from "@/types";

const ZOOM = 2;

export function ProductGallery({ images, name }: { images: ProductImage[]; name: string }) {
  const [active, setActive] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [origin, setOrigin] = useState("50% 50%");
  const trackRef = useRef<HTMLDivElement | null>(null);

  const current = images[active];
  if (!current) return null;

  function onMainClick(event: React.MouseEvent<HTMLButtonElement>) {
    if (zoomed) {
      setZoomed(false);
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    setOrigin(`${x}% ${y}%`);
    setZoomed(true);
  }

  /** Mobile: derive the active dot from the scroll position of the track. */
  function onTrackScroll() {
    const track = trackRef.current;
    if (!track) return;
    const index = Math.round(track.scrollLeft / track.clientWidth);
    if (index !== active) setActive(Math.min(Math.max(index, 0), images.length - 1));
  }

  return (
    <div>
      {/* Mobile: full-bleed swipeable carousel. */}
      <div className="lg:hidden">
        <div
          ref={trackRef}
          onScroll={onTrackScroll}
          className="-mx-4 flex snap-x snap-mandatory overflow-x-auto"
          aria-label={`${name} images`}
        >
          {images.map((image, index) => (
            <div key={image.url + index} className="w-full shrink-0 snap-start">
              <Image
                src={image.url}
                alt={image.alt}
                width={image.width}
                height={image.height}
                sizes="100vw"
                priority={index === 0}
                className="aspect-[3/4] w-full object-cover"
              />
            </div>
          ))}
        </div>

        {images.length > 1 ? (
          <div className="mt-3 flex justify-center gap-1.5">
            {images.map((image, index) => (
              <button
                key={`dot-${image.url}-${index}`}
                type="button"
                onClick={() => {
                  const track = trackRef.current;
                  if (track) track.scrollTo({ left: index * track.clientWidth });
                }}
                aria-label={`Show image ${index + 1} of ${images.length}`}
                aria-current={index === active}
                className={`h-1.5 w-1.5 rounded-full transition-colors ${
                  index === active ? "bg-kc-ink" : "bg-kc-line"
                }`}
              />
            ))}
          </div>
        ) : null}
      </div>

      {/* Desktop: thumbnail rail plus click-to-zoom main image. */}
      <div className="hidden gap-4 lg:flex">
        {images.length > 1 ? (
          <ul className="flex w-20 shrink-0 flex-col gap-3">
            {images.map((image, index) => (
              <li key={`thumb-${image.url}-${index}`}>
                <button
                  type="button"
                  onClick={() => {
                    setActive(index);
                    setZoomed(false);
                  }}
                  aria-label={`Show image ${index + 1} of ${images.length}`}
                  aria-current={index === active}
                  className={`block w-full border ${
                    index === active ? "border-kc-ink" : "border-transparent hover:border-kc-line"
                  }`}
                >
                  <Image
                    src={image.url}
                    alt=""
                    width={image.width}
                    height={image.height}
                    sizes="80px"
                    className="aspect-[3/4] w-full object-cover"
                  />
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        <button
          type="button"
          onClick={onMainClick}
          aria-label={zoomed ? "Zoom out" : "Zoom in"}
          className={`min-w-0 flex-1 overflow-hidden bg-kc-sand ${
            zoomed ? "cursor-zoom-out" : "cursor-zoom-in"
          }`}
        >
          <Image
            src={current.url}
            alt={current.alt}
            width={current.width}
            height={current.height}
            sizes="(min-width: 1280px) 720px, 55vw"
            priority
            className="aspect-[3/4] w-full object-cover transition-transform duration-300 ease-out"
            style={{
              transform: zoomed ? `scale(${ZOOM})` : "scale(1)",
              transformOrigin: origin,
            }}
          />
        </button>
      </div>
    </div>
  );
}
