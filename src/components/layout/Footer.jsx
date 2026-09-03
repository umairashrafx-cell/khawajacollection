import { Link } from "@tanstack/react-router";
import { Instagram, Facebook, Youtube } from "lucide-react";
import { categories } from "@/data/legacy/categories";

const help = [
  { label: "Track Order", to: "/track-order" },
  { label: "My Account", to: "/account" },
  { label: "Wishlist", to: "/wishlist" },
  { label: "Shopping Bag", to: "/cart" },
];

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-border bg-sand">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-4 lg:px-6">
        <div>
          <p className="font-serif text-xl tracking-wide">Khawaja Collection</p>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            Premium Pakistani fashion, made in limited runs in Lahore. Considered fabric,
            hand-finished detail, honest pricing.
          </p>
          <div className="mt-5 flex gap-4 text-muted-foreground">
            <a href="/" aria-label="Instagram">
              <Instagram className="h-4 w-4" />
            </a>
            <a href="/" aria-label="Facebook">
              <Facebook className="h-4 w-4" />
            </a>
            <a href="/" aria-label="YouTube">
              <Youtube className="h-4 w-4" />
            </a>
          </div>
        </div>

        <div>
          <p className="mb-4 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Shop</p>
          <ul className="space-y-2 text-sm">
            {categories.map((c) => (
              <li key={c.slug}>
                <Link to="/category/$slug" params={{ slug: c.slug }} className="hover:text-gold">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-4 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Help</p>
          <ul className="space-y-2 text-sm">
            {help.map((h) => (
              <li key={h.to}>
                <Link to={h.to} className="hover:text-gold">
                  {h.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-4 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            Studio
          </p>
          <address className="space-y-2 text-sm not-italic text-muted-foreground">
            <p>Main Boulevard, Gulberg III, Lahore</p>
            <p>Mon–Sat, 11am – 9pm</p>
            <p>support@khawajacollection.pk</p>
          </address>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between lg:px-6">
          <p>© {new Date().getFullYear()} Khawaja Collection. All rights reserved.</p>
          <p>Cash on Delivery · Card · Bank Transfer</p>
        </div>
      </div>
    </footer>
  );
}
