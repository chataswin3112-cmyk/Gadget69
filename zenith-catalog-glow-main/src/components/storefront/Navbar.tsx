import { lazy, Suspense, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ShoppingBag, Menu, X, Search } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { cn } from "@/lib/utils";
import gadget69Wordmark from "@/assets/gadget69-navbar-wordmark.png";

const CategoryMegaMenu = lazy(() => import("./CategoryMegaMenu"));
const CartDrawer = lazy(() => import("./CartDrawer"));

const navLinks = [
  { label: "Home", to: "/" },
  { label: "Categories", to: "/categories", hasMegaMenu: true },
  { label: "New Launches", to: "/products?filter=new" },
  { label: "Best Sellers", to: "/products?filter=best" },
  { label: "Contact Us", to: "/contact" },
];

const Navbar = () => {
  const { totalItems } = useCart();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
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
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handler = () => openCart();
    window.addEventListener("open-cart-drawer", handler);
    return () => window.removeEventListener("open-cart-drawer", handler);
  }, []);

  return (
    <>
      <nav
        className={cn(
          "sticky left-0 right-0 top-0 z-50 transition-all duration-300",
          scrolled ? "glass-solid" : "glass"
        )}
      >
        <div className="section-container flex h-[4.5rem] items-center justify-between md:h-20">
          <div className="flex flex-shrink-0 items-center">
            <Link to="/" aria-label="GADGET69 home" className="flex flex-shrink-0 items-center">
              <img
                src={gadget69Wordmark}
                alt="GADGET69"
                className="block h-auto w-[10.4rem] brightness-0 sm:w-[11.35rem] md:w-[12.55rem] lg:w-[13.65rem]"
                decoding="async"
                fetchPriority="high"
              />
            </Link>
          </div>

          <div className="hidden items-center gap-2 md:flex">
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
            <button
              aria-label="Search"
              className="hidden h-9 w-9 items-center justify-center rounded-full text-foreground/70 transition-all duration-200 hover:bg-black/[0.06] hover:text-foreground md:flex"
            >
              <Search className="h-4 w-4" />
            </button>

            <button
              onClick={openCart}
              aria-label="Open cart"
              className="relative flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200 hover:bg-black/[0.06]"
            >
              <ShoppingBag className="h-5 w-5 text-foreground" />
              {totalItems > 0 && (
                <>
                  <span className="absolute -right-1 -top-1 z-10 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">
                    {totalItems}
                  </span>
                  <span className="absolute -right-1 -top-1 h-[18px] w-[18px] rounded-full bg-accent opacity-60 animate-ping" />
                </>
              )}
            </button>

            <button
              className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-black/[0.06] md:hidden"
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
              className="hidden md:block"
            >
              <CategoryMegaMenu />
            </div>
          </Suspense>
        ) : null}

        {mobileOpen ? (
          <div className="glass border-t border-border md:hidden">
            <div className="flex flex-col gap-4 p-4">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "rounded-lg px-3 py-2.5 text-sm font-medium text-black transition-colors font-body",
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
