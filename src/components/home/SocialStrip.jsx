import women from "@/assets/hero-women.jpg";
import men from "@/assets/cat-men.jpg";
import unstitched from "@/assets/cat-unstitched.jpg";
import formals from "@/assets/cat-formals.jpg";
import { socialPosts } from "@/data/promos";

const images = [women, unstitched, men, formals];

export default function SocialStrip() {
  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
      {socialPosts.map((post, i) => (
        <figure key={post.id} className="group relative overflow-hidden bg-sand">
          <img
            src={images[i % images.length]}
            alt={post.caption}
            loading="lazy"
            width={900}
            height={900}
            className="aspect-square w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <figcaption className="absolute inset-x-0 bottom-0 bg-background/85 px-3 py-2 text-[11px] text-muted-foreground">
            {post.handle} · {post.caption}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
