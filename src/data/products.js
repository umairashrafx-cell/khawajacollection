// Mock catalogue. Replace with a database/admin source later; keep the shape.
import heroWomen from "@/assets/hero-women.jpg";
import catUnstitched from "@/assets/cat-unstitched.jpg";
import catMen from "@/assets/cat-men.jpg";
import catFormals from "@/assets/cat-formals.jpg";

const IMG = {
  women: heroWomen,
  unstitched: catUnstitched,
  men: catMen,
  formals: catFormals,
};

const SIZES_W = ["XS", "S", "M", "L", "XL"];
const SIZES_M = ["S", "M", "L", "XL", "XXL"];

function build(
  id,
  name,
  category,
  subCategory,
  price,
  compareAt,
  fabric,
  colour,
  img,
  tags,
  sizes,
) {
  return {
    id,
    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    name,
    category,
    subCategory,
    price,
    compareAtPrice: compareAt,
    currency: "PKR",
    fabric,
    colour,
    images: [img, IMG.unstitched, IMG.formals],
    sizes: sizes.map((s, i) => ({ label: s, inStock: i !== sizes.length - 1 })),
    tags,
    rating: 4.4 + ((id.charCodeAt(3) % 5) / 10),
    reviewCount: 12 + (id.charCodeAt(4) % 60),
    sku: id.toUpperCase(),
    description:
      "A considered piece from the Khawaja Collection studio, cut from " +
      fabric.toLowerCase() +
      " with hand-finished detailing and a relaxed, contemporary silhouette.",
    details: [
      "Fabric: " + fabric,
      "Colour: " + colour,
      "Hand-finished embroidery and piping",
      "Model is 5'7\" and wears size M",
    ],
    care: [
      "Dry clean recommended for embroidered pieces",
      "Cool iron on reverse; avoid direct heat on embellishments",
      "Store folded in a breathable cotton bag",
    ],
    shipping:
      "Dispatched within 2–3 working days. Free delivery on orders over PKR 5,000 across Pakistan. Easy 7-day exchange.",
  };
}

export const products = [
  build("kc-w-001", "Meher Ivory Embroidered Lawn Suit", "women", "women-unstitched", 8900, 11500, "Premium Lawn", "Ivory", IMG.women, ["new", "trending"], SIZES_W),
  build("kc-w-002", "Noor Beige Chikankari Kurta", "women", "women-pret", 6450, null, "Cotton Net", "Beige", IMG.formals, ["new"], SIZES_W),
  build("kc-w-003", "Sahar Charcoal Silk Formal", "women", "women-formals", 18900, 22500, "Raw Silk", "Charcoal", IMG.women, ["trending", "editorial"], SIZES_W),
  build("kc-w-004", "Zoya Gold Organza Gown", "women", "women-formals", 24500, null, "Organza", "Antique Gold", IMG.formals, ["editorial"], SIZES_W),
  build("kc-w-005", "Aiman Off-White Cambric Three Piece", "women", "women-unstitched", 7300, 9100, "Cambric", "Off White", IMG.unstitched, ["sale"], SIZES_W),
  build("kc-w-006", "Hina Pashmina Shawl", "women", "women-shawls", 9900, 13200, "Pashmina", "Camel", IMG.unstitched, ["sale", "trending"], SIZES_W),
  build("kc-w-007", "Rida Black Velvet Pret Set", "women", "women-pret", 15400, null, "Velvet", "Black", IMG.women, ["new"], SIZES_W),
  build("kc-w-008", "Laila Blush Chiffon Formal", "women", "women-formals", 21000, 26000, "Chiffon", "Blush", IMG.formals, ["sale"], SIZES_W),
  build("kc-m-001", "Wali Charcoal Cotton Kurta", "men", "men-kurta", 5400, null, "Egyptian Cotton", "Charcoal", IMG.men, ["new", "trending"], SIZES_M),
  build("kc-m-002", "Daniyal Off-White Shalwar Suit", "men", "men-suits", 8200, 9800, "Wash & Wear", "Off White", IMG.men, ["sale"], SIZES_M),
  build("kc-m-003", "Aziz Beige Linen Kurta", "men", "men-kurta", 6100, null, "Linen", "Beige", IMG.men, ["new"], SIZES_M),
  build("kc-m-004", "Sultan Black Embroidered Waistcoat", "men", "men-waistcoats", 11200, 13900, "Jacquard", "Black", IMG.men, ["editorial", "sale"], SIZES_M),
  build("kc-m-005", "Rehan Grey Unstitched Fabric", "men", "men-fabric", 4300, null, "Wash & Wear", "Grey", IMG.unstitched, [], SIZES_M),
  build("kc-a-001", "Sana Gold Tissue Dupatta", "accessories", "accessories-dupatta", 3900, 4900, "Tissue", "Gold", IMG.formals, ["sale"], ["One Size"]),
  build("kc-a-002", "Mahi Ivory Net Dupatta", "accessories", "accessories-dupatta", 3200, null, "Net", "Ivory", IMG.unstitched, ["new"], ["One Size"]),
  build("kc-a-003", "Heer Beige Handmade Khussa", "accessories", "accessories-footwear", 4800, 6200, "Leather", "Beige", IMG.formals, ["trending", "sale"], ["36", "37", "38", "39", "40"]),
];
