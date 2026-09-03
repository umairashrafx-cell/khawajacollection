/**
 * Homepage editorial copy. See docs/BUILD-SPEC.pdf Section 11.1.
 *
 * Copy lives here rather than in JSX so it can move to a CMS without touching
 * a component. All of it is original to KC: calm, confident, short sentences,
 * no exclamation marks (Section 1.3). None of it borrows LAAM wording.
 *
 * IMAGERY. Product, category and social tiles use the generated KC
 * placeholders from scripts/generate-placeholders.mjs. The four editorial
 * photographs came with the Lovable project; their provenance is unconfirmed,
 * so they are flagged for replacement by the real photography pipeline
 * (Section 19) before launch.
 */

import heroWomen from "@/assets/hero-women.jpg";
import catFormals from "@/assets/cat-formals.jpg";
import catMen from "@/assets/cat-men.jpg";
import catUnstitched from "@/assets/cat-unstitched.jpg";

export const hero = {
  eyebrow: "Autumn / Winter Edit",
  headline: "Quiet luxury, tailored in Lahore",
  body: "Hand-finished lawn, silk and velvet, cut in limited runs for people who dress with intent.",
  primary: { label: "Shop Women", href: "/women" },
  secondary: { label: "Shop Men", href: "/men" },
  image: {
    src: heroWomen,
    alt: "Model wearing an ivory embroidered shalwar kameez from the Khawaja Collection autumn edit",
    width: 1600,
    height: 1104,
  },
} as const;

/** Section 11.1 item 5 — the full-width editorial split. */
export const featuredCollection = {
  eyebrow: "Featured Collection",
  headline: "The New Season",
  body: "Softly structured shapes in restrained cloth. Fewer pieces, made better, meant to be worn past the season they arrive in.",
  cta: { label: "Explore the collection", href: "/collections/the-new-season" },
  image: {
    src: catUnstitched,
    alt: "Folded unstitched lawn and khaddar from the Khawaja Collection new season edit",
    width: 900,
    height: 1200,
  },
} as const;

/** Section 11.1 items 7 and 8 — banner plus four products. */
export const edits = [
  {
    id: "women",
    eyebrow: "The Women's Edit",
    headline: "Softly structured formals",
    body: "Raw silk, tissue organza and restrained gold thread, built for wedding season and the months either side of it.",
    cta: { label: "Shop women", href: "/women" },
    query: { category: "women" },
    image: {
      src: catFormals,
      alt: "Model wearing a Khawaja Collection formal in raw silk",
      width: 900,
      height: 1200,
    },
  },
  {
    id: "men",
    eyebrow: "The Men's Edit",
    headline: "Considered everyday kurtas",
    body: "Cotton, linen and khaddar in charcoal, ivory and sand. Cut clean, finished by hand, priced honestly.",
    cta: { label: "Shop men", href: "/men" },
    query: { category: "men" },
    image: {
      src: catMen,
      alt: "Model wearing a Khawaja Collection linen kurta",
      width: 912,
      height: 1200,
    },
  },
] as const;

/** Section 11.1 item 9 — the sale block, on ink with white type. */
export const sale = {
  eyebrow: "End of Season",
  headline: "Sale",
  body: "Selected pieces from earlier editions, reduced while they last.",
  cta: { label: "Shop all sale", href: "/sale" },
} as const;

/** Section 11.1 item 10. */
export const socialSection = {
  eyebrow: "Follow",
  headline: "Follow Khawaja Collection",
  body: "Studio notes, new cloth and fittings, as they happen.",
} as const;

/** Section 11.1 item 11. */
export const newsletter = {
  eyebrow: "Newsletter",
  headline: "Join the KC Family",
  body: "New arrivals and private sale access, once or twice a month.",
  privacy: "We send nothing else, and you can leave at any time.",
  cta: "Subscribe",
} as const;
