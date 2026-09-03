// Marketing content kept out of components so it can move to a CMS/admin later.

export const announcements = [
  "Free delivery across Pakistan on orders over PKR 5,000",
  "New Season Edit — Autumn Formals now live",
  "Easy 7-day exchange at all Khawaja Collection stores",
];

export const heroSlide = {
  eyebrow: "Autumn / Winter Edit",
  title: "Quiet luxury, tailored in Lahore",
  body: "Hand-finished lawn, silk and velvet pieces made in limited runs for the woman and man who dress with intent.",
  primaryCta: { label: "Shop Women", to: "/category/women" },
  secondaryCta: { label: "Shop Men", to: "/category/men" },
};

export const editorials = [
  {
    id: "ed-women",
    eyebrow: "The Women's Edit",
    title: "Softly structured formals",
    body: "Raw silk, tissue organza and restrained gold thread — pieces built for wedding season and beyond.",
    to: "/category/women",
    imageKey: "formals",
  },
  {
    id: "ed-men",
    eyebrow: "The Men's Edit",
    title: "Considered everyday kurtas",
    body: "Egyptian cotton and linen in charcoal, ivory and sand. Cut clean, finished by hand.",
    to: "/category/men",
    imageKey: "men",
  },
];

export const promoCodes = [
  { code: "KC10", type: "percent", value: 10, minSubtotal: 5000 },
  { code: "FREESHIP", type: "shipping", value: 0, minSubtotal: 0 },
];

export const socialPosts = [
  { id: "s1", handle: "@khawajacollection", caption: "Studio notes: ivory on ivory" },
  { id: "s2", handle: "@khawajacollection", caption: "Behind the embroidery frame" },
  { id: "s3", handle: "@khawajacollection", caption: "Autumn formals, first look" },
  { id: "s4", handle: "@khawajacollection", caption: "Sand, camel, charcoal" },
];

export const shippingConfig = {
  flatRate: 350,
  freeShippingThreshold: 5000,
  paymentMethods: [
    { id: "cod", label: "Cash on Delivery", note: "Pay the courier when your parcel arrives." },
    { id: "card", label: "Debit / Credit Card", note: "Demo only — no payment is processed." },
    {
      id: "bank",
      label: "Bank Transfer",
      note: "Demo only — account details shown after checkout.",
    },
  ],
};
