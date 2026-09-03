/**
 * The responsive image primitive. See CLAUDE.md (stack deviation) and
 * docs/BUILD-SPEC.pdf Sections 6.4 and 14.
 *
 * This is what stands in for `next/image` on TanStack Start. It enforces the
 * three things the spec actually cares about:
 *
 *   1. Explicit width, height and `sizes` on every image (Hard Rule 6).
 *   2. Space reserved before the bytes arrive, via `aspect-ratio` — image CLS
 *      is the most common failure in stores like this (Section 14).
 *   3. Lazy by default; only the LCP hero opts into `priority`.
 *
 * `sources` accepts AVIF/WebP variants once real photography exists. The
 * generated SVG placeholders have no raster variants, so they simply pass a
 * single `src` today.
 */

import type { CSSProperties } from "react";

export interface ImageSource {
  /** e.g. "image/avif" */
  type: string;
  srcSet: string;
}

export interface ImageProps {
  src: string;
  alt: string;
  /** Intrinsic width in pixels. Required — this is half of the CLS guarantee. */
  width: number;
  /** Intrinsic height in pixels. Required. */
  height: number;
  /** Required so the browser can pick a candidate, e.g. "(min-width: 1024px) 25vw, 50vw". */
  sizes: string;
  srcSet?: string;
  sources?: ImageSource[];
  /** True only for the LCP element. Everything else stays lazy. */
  priority?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function Image({
  src,
  alt,
  width,
  height,
  sizes,
  srcSet,
  sources,
  priority = false,
  className,
  style,
}: ImageProps) {
  const img = (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      sizes={sizes}
      {...(srcSet ? { srcSet } : {})}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding={priority ? "sync" : "async"}
      className={className}
      // The ratio holds the box open while the image loads, so nothing below
      // it moves when the bytes land.
      style={{ aspectRatio: `${width} / ${height}`, ...style }}
    />
  );

  if (!sources?.length) return img;

  return (
    <picture>
      {sources.map((source) => (
        <source key={source.type} type={source.type} srcSet={source.srcSet} sizes={sizes} />
      ))}
      {img}
    </picture>
  );
}
