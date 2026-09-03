import { Link } from "@tanstack/react-router";
import { X } from "lucide-react";
import { categories } from "@/data/categories";

const utility = [
  { to: "/wishlist", label: "Wishlist" },
  { to: "/account", label: "My Account" },
  { to: "/track-order", label: "Track Order" },
];

export default function MobileNav({ open, onClose }) {
  return (
    <div
      className={`fixed inset-0 z-50 lg:hidden ${open ? "" : "pointer-events-none"}`}
      aria-hidden={!open}
    >
      <div
        className={`absolute inset-0 bg-foreground/40 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
      />
      <nav
        className={`absolute inset-y-0 left-0 w-[86%] max-w-sm overflow-y-auto bg-background p-6 transition-transform duration-300 ${open ? "translate-x-0" : "-translate-x-full"}`}
        aria-label="Main"
      >
        <div className="mb-8 flex items-center justify-between">
          <span className="font-serif text-lg tracking-wide">Khawaja Collection</span>
          <button onClick={onClose} aria-label="Close menu" className="p-2">
            <X className="h-5 w-5" />
          </button>
        </div>

        {categories.map((c) => (
          <div key={c.slug} className="border-b border-border py-4">
            <Link
              to="/category/$slug"
              params={{ slug: c.slug }}
              onClick={onClose}
              className="text-sm uppercase tracking-[0.16em]"
            >
              {c.name}
            </Link>
            <ul className="mt-3 space-y-2">
              {c.children.map((s) => (
                <li key={s.slug}>
                  <Link
                    to="/category/$slug"
                    params={{ slug: s.slug }}
                    onClick={onClose}
                    className="text-sm text-muted-foreground"
                  >
                    {s.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <ul className="mt-6 space-y-3">
          {utility.map((u) => (
            <li key={u.to}>
              <Link to={u.to} onClick={onClose} className="text-sm text-muted-foreground">
                {u.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
