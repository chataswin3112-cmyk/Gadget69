import { Link } from "react-router-dom";
import { useAdminData } from "@/contexts/AdminDataContext";
import { ArrowUp, Instagram, Facebook } from "lucide-react";
import gadget69Logo from "@/assets/gadget69-logo.png";
import MediaImage from "@/components/ui/media-image";
import { cn } from "@/lib/utils";
import { resolveMediaUrl } from "@/lib/media";

interface FooterProps {
  variant?: "default" | "homepage";
}

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

const Footer = ({ variant = "default" }: FooterProps) => {
  const { settings } = useAdminData();
  const isHomepage = variant === "homepage";

  return (
    <footer
      className={cn(
        "mt-16",
        isHomepage
          ? "home-footer text-foreground"
          : "bg-primary text-primary-foreground"
      )}
      data-surface={isHomepage ? "paper" : undefined}
    >
      {/* Gold top accent line for homepage variant */}
      {isHomepage && (
        <div
          className="h-[2px] w-full"
          style={{
            background:
              "linear-gradient(90deg, transparent, hsl(38 55% 65%), hsl(38 70% 72%), hsl(38 55% 65%), transparent)",
          }}
        />
      )}

      <div className="section-container py-14">
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr] gap-10 items-start">

          {/* Brand column */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3">
              <img
                src={settings.logoUrl || gadget69Logo}
                alt={settings.siteTitle || "Gadget69"}
                style={{ width: "180px", height: "auto", marginTop: "-20px" }}
                className={cn(
                  isHomepage ? "brightness-0" : "brightness-0 invert"
                )}
              />
              {settings.footerText && (
                <p
                  className={cn(
                    "text-sm leading-relaxed font-body max-w-xs",
                    isHomepage ? "text-foreground/68" : "text-primary-foreground/70"
                  )}
                >
                  {settings.footerText}
                </p>
              )}
            </div>
            {/* Social icons */}
            <div className="flex items-center gap-3">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110",
                  isHomepage
                    ? "bg-black/[0.06] text-foreground/70 hover:bg-accent hover:text-accent-foreground"
                    : "bg-white/[0.08] text-primary-foreground/70 hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110",
                  isHomepage
                    ? "bg-black/[0.06] text-foreground/70 hover:bg-accent hover:text-accent-foreground"
                    : "bg-white/[0.08] text-primary-foreground/70 hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a
                href="https://wa.me/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110",
                  isHomepage
                    ? "bg-black/[0.06] text-foreground/70 hover:bg-[#25D366] hover:text-white"
                    : "bg-white/[0.08] text-primary-foreground/70 hover:bg-[#25D366] hover:text-white"
                )}
              >
                <WhatsAppIcon />
              </a>
            </div>
          </div>

          {/* Shop column */}
          <div className="flex flex-col gap-4">
            <h4 className="font-heading font-semibold text-sm uppercase tracking-wider leading-[1.2] py-[3px]">Shop</h4>
            <div
              className={cn(
                "flex flex-col gap-2.5 text-sm font-body",
                isHomepage ? "text-foreground/68" : "text-primary-foreground/70"
              )}
            >
              <Link to="/products" className="hover:text-accent transition-colors">All Products</Link>
              <Link to="/categories" className="hover:text-accent transition-colors">Categories</Link>
              <Link to="/products?filter=new" className="hover:text-accent transition-colors">New Launches</Link>
              <Link to="/products?filter=best" className="hover:text-accent transition-colors">Best Sellers</Link>
            </div>
          </div>

          {/* Company column */}
          <div className="flex flex-col gap-4">
            <h4 className="font-heading font-semibold text-sm uppercase tracking-wider leading-[1.2] py-[3px]">Company</h4>
            <div
              className={cn(
                "flex flex-col gap-2.5 text-sm font-body",
                isHomepage ? "text-foreground/68" : "text-primary-foreground/70"
              )}
            >
              <Link to="/contact" className="hover:text-accent transition-colors">Contact Us</Link>
              {settings.catalogueUrl && (
                <a href={resolveMediaUrl(settings.catalogueUrl)} className="hover:text-accent transition-colors">Catalogue</a>
              )}
            </div>
          </div>

          {/* Legal column */}
          <div className="flex flex-col gap-4">
            <h4 className="font-heading font-semibold text-sm uppercase tracking-wider leading-[1.2] py-[3px]">Legal</h4>
            <div
              className={cn(
                "flex flex-col gap-2.5 text-sm font-body",
                isHomepage ? "text-foreground/68" : "text-primary-foreground/70"
              )}
            >
              <span className="cursor-default hover:text-accent transition-colors">Privacy Policy</span>
              <span className="cursor-default hover:text-accent transition-colors">Terms of Service</span>
              <span className="cursor-default hover:text-accent transition-colors">Refund Policy</span>
            </div>
          </div>

        </div>

        <div
          className={cn(
            "mt-12 pt-8 flex items-center justify-between text-xs font-body",
            isHomepage
              ? "border-t border-[hsl(var(--surface-line))]/80 text-foreground/48"
              : "border-t border-primary-foreground/10 text-primary-foreground/50"
          )}
        >
          <span>
            © {new Date().getFullYear()} {settings.siteTitle || "Gadget69"}. All rights reserved.
          </span>
          {/* Back to top */}
          <button
            onClick={scrollToTop}
            aria-label="Back to top"
            className={cn(
              "inline-flex items-center gap-1.5 text-xs font-medium transition-all duration-200 hover:gap-2 hover:-translate-y-0.5",
              isHomepage ? "text-foreground/50 hover:text-accent" : "text-primary-foreground/50 hover:text-accent"
            )}
          >
            Back to top
            <ArrowUp className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
