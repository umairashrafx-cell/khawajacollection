/**
 * Editorial blocks. See docs/BUILD-SPEC.pdf Section 11.1 items 5, 7 and 8.
 *
 * `EditorialSplit` is the full-width featured collection: image on one side,
 * copy on the other. `EditorialBanner` is the narrower banner that sits above
 * the women's and men's four-product rows.
 */

import { Image } from "@/components/media/Image";
import { AppLink } from "@/components/layout/AppLink";

export interface EditorialContent {
  eyebrow: string;
  headline: string;
  body: string;
  cta: { label: string; href: string };
  image: { src: string; alt: string; width: number; height: number };
}

export function EditorialSplit({
  content,
  reverse = false,
}: {
  content: EditorialContent;
  reverse?: boolean;
}) {
  return (
    <section className="grid items-stretch md:grid-cols-2">
      <div className={`bg-kc-sand ${reverse ? "md:order-2" : ""}`}>
        <Image
          src={content.image.src}
          alt={content.image.alt}
          width={content.image.width}
          height={content.image.height}
          sizes="(min-width: 768px) 50vw, 100vw"
          className="h-full w-full object-cover"
          style={{ aspectRatio: "auto" }}
        />
      </div>

      <div className="flex items-center bg-kc-white px-6 py-12 md:px-12 lg:px-16 lg:py-20">
        <div className="max-w-md">
          <p className="kc-eyebrow text-kc-muted">{content.eyebrow}</p>
          <h2 className="mt-3 font-display text-[26px] leading-tight text-kc-ink md:text-[40px]">
            {content.headline}
          </h2>
          <p className="mt-4 text-sm text-kc-charcoal md:text-[15px]">{content.body}</p>
          <AppLink
            href={content.cta.href}
            className="mt-7 inline-flex min-h-11 items-center border-b border-kc-ink pb-0.5 text-[11px] font-medium uppercase tracking-[0.08em] text-kc-ink transition-colors hover:border-kc-gold lg:min-h-0"
          >
            {content.cta.label}
          </AppLink>
        </div>
      </div>
    </section>
  );
}

/** The shorter banner used above an edit's product row. */
export function EditorialBanner({ content }: { content: EditorialContent }) {
  return (
    <div className="relative overflow-hidden bg-kc-sand">
      <Image
        src={content.image.src}
        alt={content.image.alt}
        width={content.image.width}
        height={content.image.height}
        sizes="(min-width: 1024px) 1360px, 100vw"
        className="h-[280px] w-full object-cover object-[50%_22%] md:h-[340px]"
        style={{ aspectRatio: "auto" }}
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-kc-ink/70 via-kc-ink/25 to-transparent"
        aria-hidden="true"
      />
      <div className="absolute inset-x-0 bottom-0 p-6 md:p-10">
        <p className="kc-eyebrow text-kc-paper/80">{content.eyebrow}</p>
        <h2 className="mt-2 font-display text-[24px] leading-tight text-kc-paper md:text-[32px]">
          {content.headline}
        </h2>
        <p className="mt-2 max-w-md text-sm text-kc-paper/85">{content.body}</p>
      </div>
    </div>
  );
}
