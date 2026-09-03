import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { toast } from "sonner";

import { closeOverlay, openOverlay, useOverlay } from "@/store/ui-store";

const ShopContext = createContext(null);

const CART_KEY = "kc_cart_v1";
const WISH_KEY = "kc_wishlist_v1";

function load(key, fallback) {
  if (typeof window === "undefined") return fallback;
  try {
    return JSON.parse(window.localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

export function ShopProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [hydrated, setHydrated] = useState(false);

  // Drawer state lives in the UI store so only one overlay can ever be open
  // (spec Section 12). This provider keeps its old boolean API so the
  // prototype cart and search surfaces need no change until Phase 6.
  const overlay = useOverlay();
  const cartOpen = overlay === "cart";
  const searchOpen = overlay === "search";
  const setCartOpen = useCallback((open) => (open ? openOverlay("cart") : closeOverlay()), []);
  const setSearchOpen = useCallback((open) => (open ? openOverlay("search") : closeOverlay()), []);

  useEffect(() => {
    setCart(load(CART_KEY, []));
    setWishlist(load(WISH_KEY, []));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart, hydrated]);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(WISH_KEY, JSON.stringify(wishlist));
  }, [wishlist, hydrated]);

  const addToCart = useCallback((product, { size = null, quantity = 1 } = {}) => {
    const lineId = `${product.id}::${size ?? "os"}`;
    setCart((prev) => {
      const found = prev.find((l) => l.lineId === lineId);
      if (found)
        return prev.map((l) =>
          l.lineId === lineId ? { ...l, quantity: l.quantity + quantity } : l,
        );
      return [
        ...prev,
        {
          lineId,
          id: product.id,
          slug: product.slug,
          name: product.name,
          price: product.price,
          image: product.images[0],
          size,
          quantity,
        },
      ];
    });
    openOverlay("cart");
    toast.success("Added to bag", { description: product.name });
  }, []);

  const updateQuantity = useCallback((lineId, quantity) => {
    setCart((prev) =>
      quantity <= 0
        ? prev.filter((l) => l.lineId !== lineId)
        : prev.map((l) => (l.lineId === lineId ? { ...l, quantity } : l)),
    );
  }, []);

  const removeFromCart = useCallback((lineId) => {
    setCart((prev) => prev.filter((l) => l.lineId !== lineId));
    toast("Removed from bag");
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const toggleWishlist = useCallback((product) => {
    setWishlist((prev) => {
      const exists = prev.some((w) => w.id === product.id);
      if (exists) {
        toast("Removed from wishlist");
        return prev.filter((w) => w.id !== product.id);
      }
      toast.success("Saved to wishlist", { description: product.name });
      return [
        ...prev,
        {
          id: product.id,
          slug: product.slug,
          name: product.name,
          price: product.price,
          image: product.images[0],
        },
      ];
    });
  }, []);

  const value = useMemo(
    () => ({
      cart,
      wishlist,
      hydrated,
      cartOpen,
      setCartOpen,
      searchOpen,
      setSearchOpen,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      toggleWishlist,
      isWishlisted: (id) => wishlist.some((w) => w.id === id),
      cartCount: cart.reduce((n, l) => n + l.quantity, 0),
    }),
    [
      cart,
      wishlist,
      hydrated,
      cartOpen,
      searchOpen,
      setCartOpen,
      setSearchOpen,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      toggleWishlist,
    ],
  );

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShop() {
  const ctx = useContext(ShopContext);
  if (!ctx) throw new Error("useShop must be used inside <ShopProvider>");
  return ctx;
}
