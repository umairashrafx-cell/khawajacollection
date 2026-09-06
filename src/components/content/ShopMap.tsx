/**
 * The shop on a map — when, and only when, we have been told which shop.
 *
 * THIS COMPONENT SHIPPED WRONG ON 2026-09-07 AND THE FAILURE IS WORTH KEEPING.
 * It built its own embed URL from `contact.address`, on the reasoning that the
 * address was already written down once and coordinates beside it would be a
 * second copy able to disagree. That reasoning was fine and the conclusion was
 * still wrong, because it missed what an address string actually is to Google:
 * not an identifier, a SEARCH TERM. `?q=Khawaja Collection, Ameen Cloth House,
 * Katchery Road, Main Sadar Bazar, Mandi Bahauddin, 50400, Pakistan` came back
 * as "K. Khadija & Kumail", Ground Floor Al-Asar Mall — a different business on
 * a different street, whose name and 4.0 star rating were rendered on our own
 * contact page, under the heading "Find the shop", telling customers to go
 * there.
 *
 * Informal bazaar addressing is exactly where a geocoder guesses, and a guess
 * that returns a confident wrong answer is worse than one that returns nothing.
 *
 * So nothing here is derived any more. Every URL is a value Google itself
 * produced for THIS listing, pasted into src/config/site.ts, and until they
 * exist this component renders nothing at all. An absent map costs a visitor
 * one glance at the address above it; a wrong map sends them across town.
 */

import { ExternalLink, Star } from "lucide-react";

import { Section } from "@/components/content/ContentPage";
import { googleBusiness } from "@/config/site";

const LINK =
  "inline-flex min-h-11 items-center gap-2 text-sm text-kc-ink underline underline-offset-4 decoration-kc-muted transition-colors hover:decoration-kc-ink";

/**
 * Renders null when the shop has no confirmed map, so `/contact` simply has no
 * "Find the shop" section rather than an empty frame under a heading.
 */
export function ShopMap() {
  const { mapEmbedUrl, placeUrl, reviewUrl } = googleBusiness;
  if (!mapEmbedUrl && !placeUrl && !reviewUrl) return null;

  return (
    <Section heading="Find the shop">
      {/*
        Lazy, and in a fixed aspect box. The embed is several hundred kilobytes
        of Google's own scripts and tiles, and /contact is a page people reach
        on mobile data to find a phone number — so it must not load unless it
        is scrolled to, and must not shift the layout when it arrives. Taller on
        a phone, because a portrait screen showing a 16:9 strip of street map
        shows almost no street.

        Rendering this frame lets Google see the visitor's IP and set its own
        cookies. That is unavoidable for an embedded map, and the reason it is
        on /contact alone rather than in the footer of every page.
      */}
      {mapEmbedUrl ? (
        <div className="aspect-[4/3] w-full overflow-hidden border border-kc-line bg-kc-sand sm:aspect-[16/10] lg:aspect-[2/1]">
          <iframe
            // Named: to a screen reader an untitled iframe is "frame" and
            // nothing else.
            title="Map showing Khawaja Collection, Mandi Bahauddin"
            src={mapEmbedUrl}
            className="h-full w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>
      ) : null}

      <ul className="flex flex-wrap gap-x-6 gap-y-2">
        {placeUrl ? (
          <li>
            <a href={placeUrl} target="_blank" rel="noreferrer noopener" className={LINK}>
              <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
              View on Google Maps
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </li>
        ) : null}

        {/*
          No "Placeholder:" badge when this is unset, unlike the legal facts.
          A missing refund window is something a customer is owed and the badge
          is the right pressure; a review button that announces itself broken
          only makes the shop look unfinished. It renders nothing, and the
          pressure lives in the config comment instead.
        */}
        {reviewUrl ? (
          <li>
            <a href={reviewUrl} target="_blank" rel="noreferrer noopener" className={LINK}>
              <Star className="h-4 w-4 shrink-0" aria-hidden="true" />
              Leave a review
              <span className="sr-only">(opens Google in a new tab)</span>
            </a>
          </li>
        ) : null}
      </ul>
    </Section>
  );
}
