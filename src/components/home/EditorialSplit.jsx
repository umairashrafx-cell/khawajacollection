import { Link } from "@tanstack/react-router";
import men from "@/assets/cat-men.jpg";
import formals from "@/assets/cat-formals.jpg";
import { editorials } from "@/data/legacy/promos";

const images = { men, formals };

export default function EditorialSplit() {
  return (
    <div className="grid gap-3 sm:gap-4 lg:grid-cols-2">
      {editorials.map((e) => (
        <article key={e.id} className="relative overflow-hidden bg-sand">
          <img
            src={images[e.imageKey]}
            alt={e.title}
            loading="lazy"
            width={900}
            height={1200}
            className="h-[420px] w-full object-cover object-top lg:h-[520px]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/55 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-6 text-background lg:p-9">
            <p className="text-[11px] uppercase tracking-[0.24em] opacity-80">{e.eyebrow}</p>
            <h3 className="mt-2 font-serif text-2xl lg:text-3xl">{e.title}</h3>
            <p className="mt-2 max-w-sm text-sm opacity-85">{e.body}</p>
            <Link
              to={e.to}
              className="mt-5 inline-block border-b border-background pb-1 text-[11px] uppercase tracking-[0.2em]"
            >
              Explore
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}
