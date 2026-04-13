import { Link, useLocation } from "react-router-dom";
import { ShoppingBag, Menu, X, Search } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CategoryMegaMenu from "./CategoryMegaMenu";
import CartDrawer from "./CartDrawer";
import { cn } from "@/lib/utils";
import gadget69Logo from "@/assets/gadget69-logo.png";

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

  // Listen for cart-open events from product cards
  useEffect(() => {
    const handler = () => setCartOpen(true);
    window.addEventListener("open-cart-drawer", handler);
    return () => window.removeEventListener("open-cart-drawer", handler);
  }, []);

  return (
    <>
      <nav className={cn(
        "sticky top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled ? "glass-solid" : "glass"
      )}>
        <div className="section-container flex items-center justify-between h-[4.5rem] md:h-20">
          {/* Brand */}
          <motion.div
            initial={{ x: -18, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-shrink-0 items-center"
          >
            <Link to="/" aria-label="GADGET69 home" className="flex flex-shrink-0 items-center">
              <img
                src={gadget69Logo}
                alt="GADGET69"
                className="block h-auto w-[10.4rem] sm:w-[11.35rem] md:w-[12.55rem] lg:w-[13.65rem] brightness-0"
              />
            </Link>
          </motion.div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-2">
            {navLinks.map((l) => (
              <div
                key={l.to}
                className="relative"
                onMouseEnter={() => l.hasMegaMenu && setMegaMenuOpen(true)}
                onMouseLeave={() => l.hasMegaMenu && setMegaMenuOpen(false)}
              >
                <Link
                  to={l.to}
                  className={cn(
                    "inline-flex items-center rounded-full px-4 py-2 text-sm font-medium text-black font-body transition-all duration-200 hover:bg-black/[0.05] hover:text-black",
                    isLinkActive(l.to) && "bg-black/[0.06] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.04)]"
                  )}
                >
                  {l.label}
                </Link>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <button
              aria-label="Search"
              className="hidden md:flex h-9 w-9 items-center justify-center rounded-full text-foreground/70 transition-all duration-200 hover:bg-black/[0.06] hover:text-foreground"
            >
              <Search className="h-4 w-4" />
            </button>

            {/* Cart */}
            <button
              onClick={() => setCartOpen(true)}
              aria-label="Open cart"
              className="relative h-9 w-9 flex items-center justify-center rounded-full transition-all duration-200 hover:bg-black/[0.06]"
            >
              <ShoppingBag className="h-5 w-5 text-foreground" />
              {totalItems > 0 && (
                <>
                  <span className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-[10px] font-bold rounded-full h-[18px] w-[18px] flex items-center justify-center z-10">
                    {totalItems}
                  </span>
                  <span className="absolute -top-1 -right-1 h-[18px] w-[18px] rounded-full bg-accent animate-ping opacity-60" />
                </>
              )}
            </button>

            <button className="md:hidden h-9 w-9 flex items-center justify-center rounded-full hover:bg-black/[0.06] transition-colors" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mega Menu */}
        <AnimatePresence>
          {megaMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
              onMouseEnter={() => setMegaMenuOpen(true)}
              onMouseLeave={() => setMegaMenuOpen(false)}
            >
              <CategoryMegaMenu />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden overflow-hidden glass border-t border-border"
            >
              <div className="flex flex-col gap-4 p-4">
                {navLinks.map((l) => (
                  <Link
                    key={l.to}
                    to={l.to}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "rounded-lg px-3 py-2.5 text-sm font-medium text-black font-body transition-colors",
                      isLinkActive(l.to) && "bg-black/[0.06]"
                    )}
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <CartDrawer open={cartOpen} onOpenChange={setCartOpen} />
    </>
  );
};

export default Navbar;
