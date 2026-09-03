/**
 * Homepage hero. See docs/BUILD-SPEC.pdf Section 11.1 item 2.
 *
 * 88vh mobile, 92vh desktop. Eyebrow, serif headline, one supporting line, two
 * CTAs. The header sits transparent over this block until 80px of scroll.
 *
 * THIS IMAGE IS THE LCP ELEMENT. It is the only image on the site that loads
 * eagerly at high priority and is preloaded from the route head. No carousel
 * lives above the fold (Section 14), and the text sits on a gradient rather
 * than a coloured box (Section 11.1).
 */

import { Image } from "@/components/media/Image";
import { AppLink } from "@/components/layout/AppLink";
import { hero } from "@/config/home";

export function HeroSection() {
  return (
    <section className="relative h-[88vh] min-h-[520px] w-full overflow-hidden lg:h-[92vh]">
      <Image
        src={hero.image.src}
        alt={hero.image.alt}
        width={hero.image.width}
        height={hero.image.height}
        sizes="100vw"
        priority
        className="absolute inset-0 h-full w-full object-cover object-[62%_center]"
        style={{ aspectRatio: "auto" }}
      />

      {/* A gradient, not a panel — the cloth stays visible behind the words. */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-kc-paper/85 via-kc-paper/35 to-kc-paper/10 md:bg-gradient-to-r md:from-kc-paper/85 md:via-kc-paper/40 md:to-transparent"
        aria-hidden="true"
      />

      <div className="absolute inset-0 flex items-end pb-16 md:items-center md:pb-0">
        <div className="mx-auto w-full max-w-[1440px] px-4 md:px-6 lg:px-10">
          <div className="max-w-xl">
            <p className="kc-eyebrow text-kc-charcoal">{hero.eyebrow}</p>
            <h1 className="mt-4 font-display text-[34px] leading-[1.08] tracking-[-0.01em] text-kc-ink md:text-5xl lg:text-[64px]">
              {hero.headline}
            </h1>
            <p className="mt-4 max-w-md text-sm text-kc-charcoal md:text-base">{hero.body}</p>

            <div className="mt-8 flex flex-wrap gap-3">
              <AppLink
                href={hero.primary.href}
                className="bg-kc-ink px-8 py-3.5 text-[12px] font-medium uppercase tracking-[0.08em] text-kc-paper transition-colors duration-150 hover:bg-kc-charcoal"
              >
                {hero.primary.label}
              </AppLink>
              <AppLink
                href={hero.secondary.href}
                className="border border-kc-ink px-8 py-3.5 text-[12px] font-medium uppercase tracking-[0.08em] text-kc-ink transition-colors duration-150 hover:bg-kc-ink hover:text-kc-paper"
              >
                {hero.secondary.label}
              </AppLink>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
