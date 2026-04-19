import { Link } from "react-router-dom";
import { ArrowUp, Facebook, Instagram } from "lucide-react";
import { useAdminData } from "@/contexts/AdminDataContext";
import gadget69Wordmark from "@/assets/gadget69-navbar-wordmark.png";
import { resolveMediaUrl } from "@/lib/media";
import { INSTAGRAM_URL, WHATSAPP_URL } from "@/lib/social-links";
import StorefrontBrandLockup from "./StorefrontBrandLockup";

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

const footerLinkClass = "text-xs leading-5 text-white/60 transition-colors hover:text-white font-body";
const footerHeadingClass =
  "text-[11px] font-bold uppercase tracking-[0.2em] text-white/40 font-heading";

const Footer = () => {
  const { settings } = useAdminData();
  const footerLogoSrc = resolveMediaUrl(settings.logoUrl) || gadget69Wordmark;
  const catalogueUrl = resolveMediaUrl(settings.catalogueUrl);

  return (
    <footer className="bg-[#0f0f0f] text-white [content-visibility:auto] [contain-intrinsic-size:560px]">
      <div className="section-container px-5 py-8 sm:px-8 sm:py-11">
        <div className="mb-7 flex flex-col items-start text-left sm:hidden">
          <StorefrontBrandLockup
            imageSrc={footerLogoSrc}
            tone="light"
            className="mb-3 overflow-visible"
            imageClassName="h-[9rem] sm:h-[11rem] md:h-[12rem] lg:h-[13rem] w-auto object-contain"
            labelClassName="text-lg"
            fetchPriority="low"
          />
          {settings.footerText && (
            <p className="max-w-sm text-xs leading-6 text-white/55 font-body">{settings.footerText}</p>
          )}
          <div className="mt-4 flex items-center gap-3">
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white/60 transition-all duration-300 hover:bg-[#E1306C] hover:text-white"
            >
              <Instagram className="h-3.5 w-3.5" />
            </a>
            <a
              href={settings.facebookUrl || "https://facebook.com"}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white/60 transition-all duration-300 hover:bg-[#1877F2] hover:text-white"
            >
              <Facebook className="h-3.5 w-3.5" />
            </a>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white/60 transition-all duration-300 hover:bg-[#25D366] hover:text-white"
            >
              <WhatsAppIcon />
            </a>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-8 gap-y-7 border-b border-white/10 pb-7 sm:hidden">
          <div className="space-y-3 text-left">
            <p className={footerHeadingClass}>Shop</p>
            <nav className="flex flex-col items-start gap-2">
              <Link to="/products" className={footerLinkClass}>
                All Products
              </Link>
              <Link to="/categories" className={footerLinkClass}>
                Categories
              </Link>
              <Link to="/products?filter=new" className={footerLinkClass}>
                New Launches
              </Link>
              <Link to="/products?filter=best" className={footerLinkClass}>
                Best Sellers
              </Link>
            </nav>
          </div>
          <div className="space-y-3 text-left">
            <p className={footerHeadingClass}>Company</p>
            <nav className="flex flex-col items-start gap-2">
              <Link to="/contact" className={footerLinkClass}>
                Contact Us
              </Link>
              <Link to="/track-order" className={footerLinkClass}>
                Track Order
              </Link>
              {catalogueUrl && (
                <a href={catalogueUrl} className={footerLinkClass}>
                  Catalogue
                </a>
              )}
            </nav>
          </div>
          <div className="col-span-2 space-y-3 text-left">
            <p className={footerHeadingClass}>Legal</p>
            <nav className="flex flex-col items-start gap-2">
              <Link to="/privacy-policy" className={footerLinkClass}>
                Privacy Policy
              </Link>
              <Link to="/terms-and-conditions" className={footerLinkClass}>
                Terms & Conditions
              </Link>
              <Link to="/shipping-policy" className={footerLinkClass}>
                Shipping Policy
              </Link>
              <Link to="/refund-policy" className={footerLinkClass}>
                Refund Policy
              </Link>
            </nav>
          </div>
        </div>

        <div className="hidden border-b border-white/10 pb-8 sm:grid sm:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] sm:gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:gap-x-12">
          <div className="flex flex-col items-start text-left">
            <StorefrontBrandLockup
              imageSrc={footerLogoSrc}
              tone="light"
              className="mb-4 overflow-visible"
              imageClassName="h-[9rem] sm:h-[11rem] md:h-[12rem] lg:h-[13rem] w-auto object-contain"
              labelClassName="text-xl"
              fetchPriority="low"
            />
            {settings.footerText && (
              <p className="max-w-sm text-xs leading-6 text-white/55 font-body">{settings.footerText}</p>
            )}
            <div className="mt-5 flex items-center gap-3">
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white/60 transition-all duration-300 hover:bg-[#E1306C] hover:text-white hover:scale-110"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href={settings.facebookUrl || "https://facebook.com"}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white/60 transition-all duration-300 hover:bg-[#1877F2] hover:text-white hover:scale-110"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white/60 transition-all duration-300 hover:bg-[#25D366] hover:text-white hover:scale-110"
              >
                <WhatsAppIcon />
              </a>
            </div>
          </div>
          <div className="grid content-start items-start gap-x-8 gap-y-8 pt-2 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-4 text-left">
              <p className={footerHeadingClass}>Shop</p>
              <nav className="flex flex-col items-start gap-2.5">
                <Link to="/products" className={footerLinkClass}>
                  All Products
                </Link>
                <Link to="/categories" className={footerLinkClass}>
                  Categories
                </Link>
                <Link to="/products?filter=new" className={footerLinkClass}>
                  New Launches
                </Link>
                <Link to="/products?filter=best" className={footerLinkClass}>
                  Best Sellers
                </Link>
              </nav>
            </div>
            <div className="space-y-4 text-left">
              <p className={footerHeadingClass}>Company</p>
              <nav className="flex flex-col items-start gap-2.5">
                <Link to="/contact" className={footerLinkClass}>
                  Contact Us
                </Link>
                <Link to="/track-order" className={footerLinkClass}>
                  Track Order
                </Link>
                {catalogueUrl && (
                  <a href={catalogueUrl} className={footerLinkClass}>
                    Catalogue
                  </a>
                )}
              </nav>
            </div>
            <div className="space-y-4 text-left">
              <p className={footerHeadingClass}>Legal</p>
              <nav className="flex flex-col items-start gap-2.5">
                <Link to="/privacy-policy" className={footerLinkClass}>
                  Privacy Policy
                </Link>
                <Link to="/terms-and-conditions" className={footerLinkClass}>
                  Terms & Conditions
                </Link>
                <Link to="/shipping-policy" className={footerLinkClass}>
                  Shipping Policy
                </Link>
                <Link to="/refund-policy" className={footerLinkClass}>
                  Refund Policy
                </Link>
              </nav>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-start gap-3 pt-5 text-[11px] font-body text-white/30 sm:flex-row sm:items-center sm:justify-between">
          <span>Copyright {new Date().getFullYear()} Gadget 69. All rights reserved.</span>
          <button
            onClick={scrollToTop}
            aria-label="Back to top"
            className="inline-flex flex-shrink-0 items-center gap-1.5 text-[11px] font-semibold text-white/30 transition-all duration-300 hover:-translate-y-1 hover:text-white"
          >
            TOP <ArrowUp className="h-3 w-3" />
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
