// Static catalogue taxonomy. Swap this file for an API/DB call later —
// the shape returned by src/services/catalogService.js must stay the same.

export const categories = [
  {
    id: "cat-women",
    slug: "women",
    name: "Women",
    tagline: "Lawn, formals & luxury pret",
    children: [
      { slug: "women-unstitched", name: "Unstitched" },
      { slug: "women-pret", name: "Ready to Wear" },
      { slug: "women-formals", name: "Formals" },
      { slug: "women-shawls", name: "Shawls & Wraps" },
    ],
  },
  {
    id: "cat-men",
    slug: "men",
    name: "Men",
    tagline: "Kurta, shalwar suits & waistcoats",
    children: [
      { slug: "men-kurta", name: "Kurtas" },
      { slug: "men-suits", name: "Shalwar Suits" },
      { slug: "men-waistcoats", name: "Waistcoats" },
      { slug: "men-fabric", name: "Unstitched Fabric" },
    ],
  },
  {
    id: "cat-accessories",
    slug: "accessories",
    name: "Accessories",
    tagline: "Dupattas, stoles & khussa",
    children: [
      { slug: "accessories-dupatta", name: "Dupattas" },
      { slug: "accessories-footwear", name: "Khussa & Footwear" },
    ],
  },
  {
    id: "cat-sale",
    slug: "sale",
    name: "Sale",
    tagline: "End of season edit",
    children: [{ slug: "sale", name: "All Sale" }],
  },
];

export const megaMenu = categories.map((c) => ({
  slug: c.slug,
  name: c.name,
  tagline: c.tagline,
  columns: [
    { heading: "Shop by category", links: c.children },
    {
      heading: "Shop by occasion",
      links: [
        { slug: c.slug, name: "Everyday" },
        { slug: c.slug, name: "Festive" },
        { slug: c.slug, name: "Wedding" },
      ],
    },
  ],
}));
