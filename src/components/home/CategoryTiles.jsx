import { Link } from "@tanstack/react-router";
import women from "@/assets/hero-women.jpg";
import men from "@/assets/cat-men.jpg";
import unstitched from "@/assets/cat-unstitched.jpg";
import formals from "@/assets/cat-formals.jpg";

const tiles = [
  { slug: "women", name: "Women", image: women },
  { slug: "women-unstitched", name: "Unstitched", image: unstitched },
  { slug: "men", name: "Men", image: men },
  { slug: "women-formals", name: "Formals", image: formals },
];

export default function CategoryTiles() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {tiles.map((t) => (
        <Link
          key={t.slug}
          to="/category/$slug"
          params={{ slug: t.slug }}
          className="group relative block overflow-hidden bg-sand"
        >
          <img
            src={t.image}
            alt={`Shop ${t.name}`}
            loading="lazy"
            width={900}
            height={1200}
            className="aspect-[3/4] w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <span className="absolute inset-x-3 bottom-3 bg-background/90 py-2.5 text-center text-[11px] uppercase tracking-[0.2em]">
            {t.name}
          </span>
        </Link>
      ))}
    </div>
  );
}
