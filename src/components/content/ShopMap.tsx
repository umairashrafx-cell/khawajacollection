/**
 * The shop on a map, plus the two things someone looks at a map to do.
 *
 * THE IFRAME IS LAZY AND THAT IS NOT A DETAIL. An embedded Google map pulls
 * several hundred kilobytes of Google's own scripts and tiles, and /contact is
 * a page people reach on a phone, often on mobile data, to find a phone number.
 * `loading="lazy"` keeps all of it out of the initial load; the map fetches
 * only if the visitor scrolls to it. It also means the map cannot affect LCP,
 * which Section 14 already has less headroom on than we would like.
 *
 * A FIXED ASPECT BOX, not a fixed height, so the frame reserves its space
 * before the map arrives. An iframe that resizes on load is a layout shift on
 * a page that had none, and Hard Rule 6's reasoning applies to embeds as much
 * as to images. Taller on a phone than on a desktop because a portrait screen
 * showing a 16:9 strip of a street map shows almost no street.
 *
 * PRIVACY, worth stating plainly: this frame is Google's, and rendering it
 * lets Google see the visitor's IP and set its own cookies. That is the
 * unavoidable cost of an embedded map and the reason it is on /contact alone
 * rather than in the footer of every page.
 */

import { ExternalLink, MapPin, Star } from "lucide-react";

import { googleBusiness } from "@/config/site";
import { mapDirectionsUrl, mapEmbedSrc, mapListingUrl, mapQuery } from "@/lib/maps";

const LINK =
  "inline-flex min-h-11 items-center gap-2 text-sm text-kc-ink underline underline-offset-4 decoration-kc-muted transition-colors hover:decoration-kc-ink";

export function ShopMap() {
  return (
    <div className="space-y-4">
      <div className="aspect-[4/3] w-full overflow-hidden border border-kc-line bg-kc-sand sm:aspect-[16/10] lg:aspect-[2/1]">
        <iframe
          // Named, because to a screen reader an untitled iframe is "frame"
          // and nothing else. This is the only text describing what it holds.
          title={`Map showing ${mapQuery()}`}
          src={mapEmbedSrc()}
          className="h-full w-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      </div>

      <ul className="flex flex-wrap gap-x-6 gap-y-2">
        <li>
          <a href={mapDirectionsUrl()} target="_blank" rel="noreferrer noopener" className={LINK}>
            <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
            Get directions
            <ExternalLink className="h-3 w-3 shrink-0 text-kc-muted" aria-hidden="true" />
            <span className="sr-only">(opens Google Maps in a new tab)</span>
          </a>
        </li>

        {/*
          NO REVIEW LINK UNTIL THERE IS A REAL ONE, and no "Placeholder:" badge
          in its place either. The badge pattern in ContentPage exists for legal
          facts a customer needs and we owe them — a missing refund window is
          worth shouting about. A review button is an invitation, and an
          invitation that visibly announces it is broken is worse for the shop
          than no invitation at all. So this renders nothing, and the pressure
          to fill it lives in the config comment instead.

          The URL cannot be derived: Google keys it to the Place ID, which is
          not a function of the name or the address. It is one click to copy
          from the Business Profile's own "Ask for reviews" button.
        */}
        {googleBusiness.reviewUrl ? (
          <li>
            <a
              href={googleBusiness.reviewUrl}
              target="_blank"
              rel="noreferrer noopener"
              className={LINK}
            >
              <Star className="h-4 w-4 shrink-0" aria-hidden="true" />
              Leave a review
              <ExternalLink className="h-3 w-3 shrink-0 text-kc-muted" aria-hidden="true" />
              <span className="sr-only">(opens Google in a new tab)</span>
            </a>
          </li>
        ) : null}

        <li>
          <a href={mapListingUrl()} target="_blank" rel="noreferrer noopener" className={LINK}>
            <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
            View on Google Maps
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        </li>
      </ul>
    </div>
  );
}
