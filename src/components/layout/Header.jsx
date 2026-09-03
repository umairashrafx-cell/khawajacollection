import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, Search, Heart, ShoppingBag, User } from "lucide-react";
import { categories } from "@/data/categories";
import { useShop } from "@/context/ShopContext";
import MegaMenu from "./MegaMenu";
import MobileNav from "./MobileNav";

export default function Header() {
  const { cartCount, wishlist, setCartOpen, setSearchOpen } = useShop();
  const [activeSlug, setActiveSlug] = useState(null);
  const [navOpen, setNavOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 bg-background/95 backdrop-blur transition-shadow ${scrolled ? "shadow-[0_1px_0_0_var(--border)]" : ""}`}
    >
      <div className="relative mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 lg:px-6">
        <button className="p-2 lg:hidden" aria-label="Open menu" onClick={() => setNavOpen(true)}>
          <Menu className="h-5 w-5" />
        </button>

        <Link to="/" className="shrink-0 font-serif text-lg tracking-[0.14em] sm:text-xl">
          KHAWAJA<span className="text-gold">.</span>
        </Link>

        <nav className="ml-8 hidden items-center gap-7 lg:flex" aria-label="Categories">
          {categories.map((c) => (
            <Link
              key={c.slug}
              to="/category/$slug"
              params={{ slug: c.slug }}
              onMouseEnter={() => setActiveSlug(c.slug)}
              onFocus={() => setActiveSlug(c.slug)}
              className="py-5 text-[12px] uppercase tracking-[0.18em] text-foreground/80 transition-colors hover:text-gold"
            >
              {c.name}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <button className="p-2" aria-label="Search" onClick={() => setSearchOpen(true)}>
            <Search className="h-5 w-5" />
          </button>
          <Link to="/wishlist" className="relative hidden p-2 sm:block" aria-label="Wishlist">
            <Heart className="h-5 w-5" />
            {wishlist.length > 0 && <Badge>{wishlist.length}</Badge>}
          </Link>
          <Link to="/account" className="hidden p-2 sm:block" aria-label="Account">
            <User className="h-5 w-5" />
          </Link>
          <button className="relative p-2" aria-label="Shopping bag" onClick={() => setCartOpen(true)}>
            <ShoppingBag className="h-5 w-5" />
            {cartCount > 0 && <Badge>{cartCount}</Badge>}
          </button>
        </div>

        <div onMouseLeave={() => setActiveSlug(null)}>
          <MegaMenu activeSlug={activeSlug} onClose={() => setActiveSlug(null)} />
        </div>
      </div>

      <MobileNav open={navOpen} onClose={() => setNavOpen(false)} />
    </header>
  );
}

function Badge({ children }) {
  return (
    <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-medium text-foreground">
      {children}
    </span>
  );
}
