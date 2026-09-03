import { Link } from "@tanstack/react-router";
import { megaMenu } from "@/data/categories";

export default function MegaMenu({ activeSlug, onClose }) {
  const menu = megaMenu.find((m) => m.slug === activeSlug);
  if (!menu) return null;

  return (
    <div
      className="absolute inset-x-0 top-full hidden border-t border-border bg-background shadow-[0_24px_48px_-24px_rgba(0,0,0,0.25)] lg:block"
      onMouseLeave={onClose}
    >
      <div className="mx-auto grid max-w-7xl grid-cols-4 gap-10 px-6 py-10">
        {menu.columns.map((col) => (
          <div key={col.heading}>
            <p className="mb-4 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              {col.heading}
            </p>
            <ul className="space-y-2.5">
              {col.links.map((link) => (
                <li key={col.heading + link.name}>
                  <Link
                    to="/category/$slug"
                    params={{ slug: link.slug }}
                    onClick={onClose}
                    className="text-sm text-foreground/80 transition-colors hover:text-gold"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div className="col-span-2 rounded-sm bg-sand p-8">
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            {menu.name}
          </p>
          <h3 className="mt-3 font-serif text-2xl">{menu.tagline}</h3>
          <Link
            to="/category/$slug"
            params={{ slug: menu.slug }}
            onClick={onClose}
            className="mt-5 inline-block border-b border-foreground pb-1 text-xs uppercase tracking-[0.2em]"
          >
            Shop the edit
          </Link>
        </div>
      </div>
    </div>
  );
}
