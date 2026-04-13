import { Link } from "react-router-dom";
import { useAdminData } from "@/contexts/AdminDataContext";
import { ArrowUp, Instagram, Facebook } from "lucide-react";
import gadget69Logo from "@/assets/gadget69-logo.png";
import { cn } from "@/lib/utils";
import { resolveMediaUrl } from "@/lib/media";

interface FooterProps {
  variant?: "default" | "homepage";
}

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

const Footer = ({ variant = "default" }: FooterProps) => {
  const { settings } = useAdminData();
  const isHomepage = variant === "homepage";

  const linkCls = cn(
    "text-xs transition-colors hover:text-accent font-body",
    isHomepage ? "text-foreground/60" : "text-primary-foreground/65"
  );

  const headingCls = cn(
    "mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] font-heading",
    isHomepage ? "text-foreground/50" : "text-primary-foreground/50"
  );

  const iconCls = cn(
    "h-7 w-7 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110",
    isHomepage
      ? "bg-black/[0.06] text-foreground/60 hover:bg-accent hover:text-accent-foreground"
      : "bg-white/[0.08] text-primary-foreground/60 hover:bg-accent hover:text-accent-foreground"
  );

  return (
    <footer
      className={cn(
        "mt-0",
        isHomepage
          ? "home-footer text-foreground"
          : "bg-primary text-primary-foreground"
      )}
      data-surface={isHomepage ? "paper" : undefined}
    >
      {/* Gold accent line */}
      {isHomepage && (
        <div
          className="h-[1.5px] w-full"
          style={{
            background:
              "linear-gradient(90deg, transparent, hsl(38 55% 65%), hsl(38 70% 72%), hsl(38 55% 65%), transparent)",
          }}
        />
      )}

      <div className="section-container py-10">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 md:grid-cols-[1.8fr_1fr_1fr_1fr] md:gap-10 items-start">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-1 flex flex-col gap-3">
            <img
              src={settings.logoUrl || gadget69Logo}
              alt={settings.siteTitle || "Gadget69"}
              style={{ width: "130px", height: "auto" }}
              className={cn(isHomepage ? "brightness-0" : "brightness-0 invert")}
            />
            {settings.footerText && (
              <p
                className={cn(
                  "text-xs leading-relaxed font-body max-w-[200px]",
                  isHomepage ? "text-foreground/55" : "text-primary-foreground/60"
                )}
              >
                {settings.footerText}
              </p>
            )}
            {/* Social icons */}
            <div className="flex items-center gap-2 mt-1">
              <a href={settings.instagramUrl || "https://instagram.com"} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className={iconCls}>
                <Instagram className="h-3.5 w-3.5" />
              </a>
              <a href={settings.facebookUrl || "https://facebook.com"} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className={iconCls}>
                <Facebook className="h-3.5 w-3.5" />
              </a>
              <a
                href={settings.whatsappNumber ? `https://wa.me/${settings.whatsappNumber}` : "https://wa.me/"}
                target="_blank" rel="noopener noreferrer" aria-label="WhatsApp"
                className={cn(iconCls, "hover:!bg-[#25D366] hover:!text-white")}
              >
                <WhatsAppIcon />
              </a>
            </div>
          </div>

          {/* Shop */}
          <div className="flex flex-col">
            <p className={headingCls}>Shop</p>
            <div className="flex flex-col gap-2">
              <Link to="/products" className={linkCls}>All Products</Link>
              <Link to="/categories" className={linkCls}>Categories</Link>
              <Link to="/products?filter=new" className={linkCls}>New Launches</Link>
              <Link to="/products?filter=best" className={linkCls}>Best Sellers</Link>
            </div>
          </div>

          {/* Company */}
          <div className="flex flex-col">
            <p className={headingCls}>Company</p>
            <div className="flex flex-col gap-2">
              <Link to="/contact" className={linkCls}>Contact Us</Link>
              {settings.catalogueUrl && (
                <a href={resolveMediaUrl(settings.catalogueUrl)} className={linkCls}>Catalogue</a>
              )}
            </div>
          </div>

          {/* Legal */}
          <div className="flex flex-col">
            <p className={headingCls}>Legal</p>
            <div className="flex flex-col gap-2">
              <span className={cn(linkCls, "cursor-default")}>Privacy Policy</span>
              <span className={cn(linkCls, "cursor-default")}>Terms of Service</span>
              <span className={cn(linkCls, "cursor-default")}>Refund Policy</span>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className={cn(
            "mt-8 pt-5 flex items-center justify-between text-[11px] font-body",
            isHomepage
              ? "border-t border-[hsl(var(--surface-line))]/60 text-foreground/40"
              : "border-t border-primary-foreground/10 text-primary-foreground/40"
          )}
        >
          <span>
            © {new Date().getFullYear()} {settings.siteTitle || "Gadget69"}. All rights reserved.
          </span>
          <button
            onClick={scrollToTop}
            aria-label="Back to top"
            className={cn(
              "inline-flex items-center gap-1.5 text-[11px] font-medium transition-all duration-200 hover:-translate-y-0.5",
              isHomepage ? "text-foreground/40 hover:text-accent" : "text-primary-foreground/40 hover:text-accent"
            )}
          >
            Back to top
            <ArrowUp className="h-3 w-3" />
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
