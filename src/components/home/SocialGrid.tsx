/**
 * Follow Khawaja Collection. See docs/BUILD-SPEC.pdf Section 11.1 item 10.
 *
 * NO TILES UNTIL THERE ARE REAL PHOTOGRAPHS. The grid was six hardcoded
 * generated SVGs — grey blocks reading "KC / PRODUCT IMAGE" — under a heading
 * asking people to follow the shop. Placeholder imagery is the one kind of
 * placeholder that cannot be quietly lived with: a customer reads it instantly
 * as a site that is not finished, and it sat directly above the newsletter
 * sign-up, which is the last thing they see before deciding to trust us.
 *
 * All four channels are real (supplied 2026-09-04), so the section still has
 * something true to show. The `PLACEHOLDER` guard stays anyway — a URL can be
 * cleared as easily as it was filled, and a dead "Follow us" link is worse
 * than an absent one.
 */

import { Facebook, Instagram, Music2, Youtube } from "lucide-react";

import { Image } from "@/components/media/Image";
import { PLACEHOLDER, site, social, socialTiles } from "@/config/site";

export function SocialGrid() {
  const channels: { label: string; href: string; Icon: typeof Facebook }[] = [
    { label: "Facebook", href: social.facebook, Icon: Facebook },
    { label: "Instagram", href: social.instagram, Icon: Instagram },
    { label: "TikTok", href: social.tiktok, Icon: Music2 },
    { label: "YouTube", href: social.youtube, Icon: Youtube },
  ];
  const live = channels.filter((c) => c.href !== "#" && c.href !== PLACEHOLDER);

  return (
    <div>
      {socialTiles.length > 0 ? (
        <ul className="grid grid-cols-3 gap-2 md:grid-cols-6 md:gap-4">
          {socialTiles.map((tile, index) => (
            <li key={tile} className="overflow-hidden bg-kc-sand">
              <Image
                src={tile}
                alt=""
                width={900}
                height={1200}
                sizes="(min-width: 768px) 16vw, 33vw"
                className="aspect-square w-full object-cover"
                style={{ aspectRatio: "1 / 1" }}
              />
              <span className="sr-only">Khawaja Collection image {index + 1}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {live.length > 0 ? (
        <ul className={`flex flex-wrap gap-3 ${socialTiles.length > 0 ? "mt-6" : ""}`}>
          {live.map(({ label, href, Icon }) => (
            <li key={label}>
              <a
                href={href}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex min-h-11 items-center gap-2 border border-kc-line bg-kc-white px-4 py-2.5 text-[11px] font-medium uppercase tracking-[0.08em] text-kc-ink transition-colors hover:border-kc-gold"
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
