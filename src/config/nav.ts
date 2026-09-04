/**
 * Khawaja Collection — the entire navigation tree as typed data.
 * See docs/BUILD-SPEC.pdf Section 7 and Section 10.2.
 *
 * Header, MegaMenu, MobileNav and Footer all render from this file.
 * Guardrail: no hardcoded nav links in JSX, ever.
 */

export interface NavLink {
  label: string;
  href: string;
}

export interface NavColumn {
  heading: string;
  links: NavLink[];
}

/** The single promotional image tile in a mega menu panel (Section 10.2). */
export interface NavPromo {
  eyebrow: string;
  headline: string;
  href: string;
  image: {
    /** Generated locally by scripts/ in Phase 1. Never hotlink an external image. */
    src: string;
    alt: string;
    width: number;
    height: number;
  };
}

export interface NavSection {
  label: string;
  href: string;
  /** Three link columns per Section 10.2. Sections without a panel omit these. */
  columns?: NavColumn[];
  promo?: NavPromo;
  /** `/sale` gets the distinct dark treatment (Section 11.1 item 9). */
  isSale?: boolean;
}

export const primaryNav: NavSection[] = [
  {
    label: "New In",
    href: "/new-arrivals",
  },
  {
    label: "Women",
    href: "/women",
    columns: [
      {
        heading: "Shop by category",
        links: [
          { label: "Unstitched", href: "/women/unstitched" },
          { label: "Ready to Wear", href: "/women/ready-to-wear" },
          { label: "Formals", href: "/women/formals" },
          { label: "Bridal", href: "/women/bridal" },
          { label: "Shawls & Wraps", href: "/women/shawls" },
        ],
      },
      {
        heading: "Shop by fabric",
        links: [
          { label: "Lawn", href: "/women?fabric=lawn" },
          { label: "Cotton", href: "/women?fabric=cotton" },
          { label: "Chiffon", href: "/women?fabric=chiffon" },
          { label: "Organza", href: "/women?fabric=organza" },
          { label: "Silk", href: "/women?fabric=silk" },
          { label: "Velvet", href: "/women?fabric=velvet" },
        ],
      },
      {
        heading: "Shop by pieces",
        links: [
          { label: "1 Piece", href: "/women?pieces=1" },
          { label: "2 Piece", href: "/women?pieces=2" },
          { label: "3 Piece", href: "/women?pieces=3" },
          { label: "On Sale", href: "/women?onSale=true" },
        ],
      },
    ],
    promo: {
      eyebrow: "The Women's Edit",
      headline: "Softly structured formals",
      href: "/collections/the-new-season",
      image: {
        src: "/placeholders/nav-women-4x5.svg",
        alt: "Khawaja Collection women's formal edit",
        width: 480,
        height: 600,
      },
    },
  },
  {
    label: "Men",
    href: "/men",
    columns: [
      {
        heading: "Shop by category",
        links: [
          { label: "Kurtas", href: "/men/kurtas" },
          { label: "Shalwar Suits", href: "/men/shalwar-suits" },
          { label: "Waistcoats", href: "/men/waistcoats" },
          { label: "Unstitched Fabric", href: "/men/unstitched" },
        ],
      },
      {
        heading: "Shop by fabric",
        links: [
          { label: "Cotton", href: "/men?fabric=cotton" },
          { label: "Linen", href: "/men?fabric=linen" },
          { label: "Khaddar", href: "/men?fabric=khaddar" },
          { label: "Wash & Wear", href: "/men?fabric=wash-and-wear" },
        ],
      },
      {
        heading: "Shop by occasion",
        links: [
          { label: "Everyday", href: "/men?tag=everyday" },
          { label: "Festive", href: "/men?tag=festive" },
          { label: "Wedding", href: "/men?tag=wedding" },
          { label: "On Sale", href: "/men?onSale=true" },
        ],
      },
    ],
    promo: {
      eyebrow: "The Men's Edit",
      headline: "Considered everyday kurtas",
      href: "/collections/the-new-season",
      image: {
        src: "/placeholders/nav-men-4x5.svg",
        alt: "Khawaja Collection men's kurta edit",
        width: 480,
        height: 600,
      },
    },
  },
  {
    label: "Bedsheets",
    href: "/bedsheets",
    columns: [
      {
        heading: "Shop by size",
        links: [
          { label: "Single", href: "/bedsheets/single" },
          { label: "Double", href: "/bedsheets/double" },
          { label: "King", href: "/bedsheets/king" },
          { label: "Quilt Covers", href: "/bedsheets/quilt-covers" },
        ],
      },
      {
        heading: "Shop by weave",
        links: [
          { label: "Cotton", href: "/bedsheets?fabric=cotton" },
          { label: "Percale", href: "/bedsheets?fabric=percale" },
          { label: "Sateen", href: "/bedsheets?fabric=sateen" },
          { label: "Flannel", href: "/bedsheets?fabric=flannel" },
          { label: "Jacquard", href: "/bedsheets?fabric=jacquard" },
        ],
      },
      {
        heading: "Shop by colour",
        links: [
          { label: "Ivory", href: "/bedsheets?color=ivory" },
          { label: "Navy", href: "/bedsheets?color=navy" },
          { label: "Emerald", href: "/bedsheets?color=emerald" },
          { label: "On Sale", href: "/bedsheets?onSale=true" },
        ],
      },
    ],
    promo: {
      eyebrow: "Home Textiles",
      headline: "Woven, not printed",
      href: "/bedsheets",
      image: {
        src: "/placeholders/nav-bedsheets-4x5.svg",
        alt: "Khawaja Collection bedsheets",
        width: 480,
        height: 600,
      },
    },
  },
  { label: "Unstitched", href: "/unstitched" },
  { label: "Ready to Wear", href: "/ready-to-wear" },
  { label: "Bridal", href: "/bridal" },
  { label: "Sale", href: "/sale", isSale: true },
];

/** Section 11.1 item 3 — six 4:5 cards on the homepage. */
export const shopByCategory: NavLink[] = [
  { label: "Women", href: "/women" },
  { label: "Men", href: "/men" },
  { label: "Unstitched", href: "/unstitched" },
  { label: "Ready to Wear", href: "/ready-to-wear" },
  { label: "Bridal", href: "/bridal" },
  { label: "Accessories", href: "/accessories" },
];

/** Section 11.1 item 12 — four footer columns. */
export const footerNav: NavColumn[] = [
  {
    heading: "Customer Care",
    links: [
      { label: "Contact", href: "/contact" },
      { label: "FAQs", href: "/faqs" },
      { label: "Shipping", href: "/shipping" },
      { label: "Exchange & Returns", href: "/returns" },
      { label: "Track Order", href: "/track-order" },
    ],
  },
  {
    heading: "About KC",
    links: [
      { label: "Our Story", href: "/about" },
      { label: "Stores", href: "/contact" },
    ],
  },
  {
    heading: "Shop",
    links: [
      { label: "New In", href: "/new-arrivals" },
      { label: "Women", href: "/women" },
      { label: "Men", href: "/men" },
      { label: "Unstitched", href: "/unstitched" },
      { label: "Bedsheets", href: "/bedsheets" },
      { label: "Sale", href: "/sale" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Refund Policy", href: "/refund-policy" },
    ],
  },
];

/** Pinned to the bottom of the mobile sheet (Section 10.2). */
export const accountNav: NavLink[] = [
  { label: "My Account", href: "/account" },
  { label: "Wishlist", href: "/wishlist" },
  { label: "Track Order", href: "/track-order" },
];

/** Routes that must never be indexed (Section 7, Section 13). */
export const noindexRoutes = [
  "/cart",
  "/checkout",
  "/wishlist",
  "/account",
  "/admin",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
] as const;
