/**
 * Follow Khawaja Collection. See docs/BUILD-SPEC.pdf Section 11.1 item 10.
 *
 * Six square tiles. Guardrail 2: the Instagram URL is a PLACEHOLDER, so only
 * the channels that have a real URL render as links. The tiles themselves are
 * generated placeholders until the studio feed exists.
 */

import { Facebook, Instagram } from "lucide-react";

import { Image } from "@/components/media/Image";
import { PLACEHOLDER, site, social } from "@/config/site";

const TILES = [
  "product-02",
  "product-05",
  "product-08",
  "product-11",
  "product-03",
  "product-07",
] as const;

export function SocialGrid() {
  const channels: { label: string; href: string; Icon: typeof Facebook }[] = [
    { label: "Facebook", href: social.facebook, Icon: Facebook },
    { label: "Instagram", href: social.instagram, Icon: Instagram },
  ];
  const live = channels.filter((c) => c.href !== "#" && c.href !== PLACEHOLDER);

  return (
    <div>
      <ul className="grid grid-cols-3 gap-2 md:grid-cols-6 md:gap-4">
        {TILES.map((tile, index) => (
          <li key={tile} className="overflow-hidden bg-kc-sand">
            <Image
              src={`/placeholders/${tile}-3x4.svg`}
              alt=""
              width={900}
              height={1200}
              sizes="(min-width: 768px) 16vw, 33vw"
              className="aspect-square w-full object-cover"
              style={{ aspectRatio: "1 / 1" }}
            />
            <span className="sr-only">Studio image {index + 1}</span>
          </li>
        ))}
      </ul>

      {live.length > 0 ? (
        <ul className="mt-6 flex flex-wrap gap-3">
          {live.map(({ label, href, Icon }) => (
            <li key={label}>
              <a
                href={href}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-2 border border-kc-line bg-kc-white px-4 py-2.5 text-[11px] font-medium uppercase tracking-[0.08em] text-kc-ink transition-colors hover:border-kc-gold"
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {label}
                <span className="sr-only">— {site.name}</span>
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
