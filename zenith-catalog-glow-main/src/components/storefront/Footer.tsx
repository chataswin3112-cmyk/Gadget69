import { Link } from "react-router-dom";
import { useAdminData } from "@/contexts/AdminDataContext";
import { ArrowUp, Instagram, Facebook } from "lucide-react";
import gadget69Logo from "@/assets/gadget69-logo.png";
import { resolveMediaUrl } from "@/lib/media";

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

const Footer = () => {
  const { settings } = useAdminData();

  return (
    <footer className="bg-[#0f0f0f] text-white">
      <div className="section-container py-12">
        <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-4 md:grid-cols-[1.6fr_1fr_1fr_1fr] items-start">

          {/* Brand column */}
          <div className="col-span-2 sm:col-span-1 flex flex-col gap-0">
            {/* Logo */}
            <img
              src={settings.logoUrl || gadget69Logo}
              alt={settings.siteTitle || "Gadget69"}
              style={{ width: "120px", height: "auto" }}
              className="brightness-0 invert"
            />
            {/* Description */}
            {settings.footerText && (
              <p className="mt-3 text-xs leading-relaxed text-white/55 font-body max-w-[200px]">
                {settings.footerText}
              </p>
            )}
            {/* Social icons — directly below name */}
            <div className="mt-4 flex items-center gap-2">
              <a
                href={settings.instagramUrl || "https://instagram.com"}
                target="_blank" rel="noopener noreferrer" aria-label="Instagram"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/70 transition-all duration-200 hover:bg-[#E1306C] hover:text-white hover:scale-110"
              >
                <Instagram className="h-3.5 w-3.5" />
              </a>
              <a
                href={settings.facebookUrl || "https://facebook.com"}
                target="_blank" rel="noopener noreferrer" aria-label="Facebook"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/70 transition-all duration-200 hover:bg-[#1877F2] hover:text-white hover:scale-110"
              >
                <Facebook className="h-3.5 w-3.5" />
              </a>
              <a
                href={settings.whatsappNumber ? `https://wa.me/${settings.whatsappNumber}` : "https://wa.me/"}
                target="_blank" rel="noopener noreferrer" aria-label="WhatsApp"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/70 transition-all duration-200 hover:bg-[#25D366] hover:text-white hover:scale-110"
              >
                <WhatsAppIcon />
              </a>
            </div>
          </div>

          {/* Shop */}
          <div className="flex flex-col gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40 font-heading">
              Shop
            </p>
            <div className="flex flex-col gap-2.5">
              <Link to="/products" className="text-xs text-white/65 hover:text-white transition-colors font-body">All Products</Link>
              <Link to="/categories" className="text-xs text-white/65 hover:text-white transition-colors font-body">Categories</Link>
              <Link to="/products?filter=new" className="text-xs text-white/65 hover:text-white transition-colors font-body">New Launches</Link>
              <Link to="/products?filter=best" className="text-xs text-white/65 hover:text-white transition-colors font-body">Best Sellers</Link>
            </div>
          </div>

          {/* Company */}
          <div className="flex flex-col gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40 font-heading">
              Company
            </p>
            <div className="flex flex-col gap-2.5">
              <Link to="/contact" className="text-xs text-white/65 hover:text-white transition-colors font-body">Contact Us</Link>
              {settings.catalogueUrl && (
                <a href={resolveMediaUrl(settings.catalogueUrl)} className="text-xs text-white/65 hover:text-white transition-colors font-body">Catalogue</a>
              )}
            </div>
          </div>

          {/* Legal */}
          <div className="flex flex-col gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40 font-heading">
              Legal
            </p>
            <div className="flex flex-col gap-2.5">
              <span className="text-xs text-white/65 cursor-default font-body">Privacy Policy</span>
              <span className="text-xs text-white/65 cursor-default font-body">Terms of Service</span>
              <span className="text-xs text-white/65 cursor-default font-body">Refund Policy</span>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex items-center justify-between border-t border-white/10 pt-6 text-[11px] font-body text-white/30">
          <span>© {new Date().getFullYear()} {settings.siteTitle || "Gadget69"}. All rights reserved.</span>
          <button
            onClick={scrollToTop}
            aria-label="Back to top"
            className="inline-flex items-center gap-1.5 text-[11px] text-white/30 font-medium transition-all duration-200 hover:text-white hover:-translate-y-0.5"
          >
            Back to top <ArrowUp className="h-3 w-3" />
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
