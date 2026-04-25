import { lazy, Suspense, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ShoppingBag, Menu, X, Search } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { cn } from "@/lib/utils";

import gadget69Wordmark from "@/assets/gadget69-navbar-wordmark.webp";
import StorefrontBrandLockup from "./StorefrontBrandLockup";

const CategoryMegaMenu = lazy(() => import("./CategoryMegaMenu"));
const CartDrawer = lazy(() => import("./CartDrawer"));

const navLinks = [
  { label: "Home", to: "/" },
  { label: "Categories", to: "/categories", hasMegaMenu: true },
  { label: "New Launches", to: "/products?filter=new" },
  { label: "Best Sellers", to: "/products?filter=best" },
  { label: "Track Order", to: "/track-order" },
  { label: "Contact Us", to: "/contact" },
];

const Navbar = () => {
  const { totalItems } = useCart();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [shouldRenderCart, setShouldRenderCart] = useState(false);
  const [shouldRenderMegaMenu, setShouldRenderMegaMenu] = useState(false);

  const openCart = () => {
    setShouldRenderCart(true);
    setCartOpen(true);
  };

  const isLinkActive = (to: string) => {
    const [pathname, query = ""] = to.split("?");
    const targetQuery = new URLSearchParams(query);
    const currentQuery = new URLSearchParams(location.search);

    if (pathname === "/") {
      return location.pathname === "/";
    }

    if (pathname === "/categories") {
      return location.pathname === "/categories" || location.pathname.startsWith("/categories/");
    }

    if (pathname === "/products") {
      if (location.pathname !== "/products") {
        return false;
      }

      const targetFilter = targetQuery.get("filter");
      if (!targetFilter) {
        return true;
      }

      return currentQuery.get("filter") === targetFilter;
    }

    return location.pathname === pathname;
  };

  useEffect(() => {
    const handler = () => openCart();
    window.addEventListener("open-cart-drawer", handler);
    return () => window.removeEventListener("open-cart-drawer", handler);
  }, []);

  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>

      <nav aria-label="Primary" className="sticky left-0 right-0 top-0 z-50 glass-solid">
        <div className="section-container flex h-[4.25rem] items-center justify-between gap-3 md:h-24">
          <div className="flex flex-shrink-0 items-center">
            <Link to="/" aria-label="Gadget 69 home" className="flex min-w-0 flex-shrink-0 items-center overflow-visible">
              <StorefrontBrandLockup
                imageSrc={gadget69Wordmark}
                tone="dark"
                imageClassName="h-[6.75rem] w-[6.75rem] sm:h-[9rem] sm:w-[9rem] md:h-[12rem] md:w-[12rem] lg:h-[13rem] lg:w-[13rem] object-contain"
                labelClassName="text-base sm:text-lg md:text-xl"
                loading="eager"
                fetchPriority="high"
              />
            </Link>
          </div>

          <div className="hidden items-center gap-2 lg:flex">
            {navLinks.map((link) => (
              <div
                key={link.to}
                className="relative"
                onMouseEnter={() => {
                  if (!link.hasMegaMenu) {
                    return;
                  }

                  setShouldRenderMegaMenu(true);
                  setMegaMenuOpen(true);
                }}
                onMouseLeave={() => {
                  if (link.hasMegaMenu) {
                    setMegaMenuOpen(false);
                  }
                }}
              >
                <Link
                  to={link.to}
                  className={cn(
                    "inline-flex items-center rounded-full px-4 py-2 text-sm font-medium text-black transition-all duration-200 hover:bg-black/[0.05] hover:text-black font-body",
                    isLinkActive(link.to) && "bg-black/[0.06] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.04)]"
                  )}
                >
                  {link.label}
                </Link>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/products"
              aria-label="Search products"
              className="hidden h-9 w-9 items-center justify-center rounded-full text-foreground/70 transition-colors hover:bg-black/[0.06] hover:text-foreground lg:flex"
            >
              <Search className="h-4 w-4" />
            </Link>

            <button
              type="button"
              onClick={openCart}
              aria-label={totalItems > 0 ? `Open cart (${totalItems} items)` : "Open cart"}
              className="relative flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-black/[0.06]"
            >
              <ShoppingBag className="h-5 w-5 text-foreground" />
              {totalItems > 0 && (
                <span className="absolute -right-1 -top-1 z-10 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">
                  {totalItems}
                </span>
              )}
            </button>

            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-black/[0.06] lg:hidden"
              onClick={() => setMobileOpen((current) => !current)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {megaMenuOpen && shouldRenderMegaMenu ? (
          <Suspense fallback={null}>
            <div
              onMouseEnter={() => setMegaMenuOpen(true)}
              onMouseLeave={() => setMegaMenuOpen(false)}
              className="hidden lg:block"
            >
              <CategoryMegaMenu />
            </div>
          </Suspense>
        ) : null}

        {mobileOpen ? (
          <div className="border-t border-border bg-card lg:hidden">
            <div className="flex max-h-[calc(100svh-4.25rem)] flex-col gap-3 overflow-y-auto p-4">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "rounded-lg px-3 py-3 text-sm font-medium text-black transition-colors font-body",
                    isLinkActive(link.to) && "bg-black/[0.06]"
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </nav>

      {shouldRenderCart ? (
        <Suspense fallback={null}>
          <CartDrawer open={cartOpen} onOpenChange={setCartOpen} />
        </Suspense>
      ) : null}
    </>
  );
};

export default Navbar;
