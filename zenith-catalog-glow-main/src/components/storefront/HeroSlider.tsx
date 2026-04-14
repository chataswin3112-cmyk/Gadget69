import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAdminData } from "@/contexts/AdminDataContext";
import { cn } from "@/lib/utils";
import MediaImage from "@/components/ui/media-image";

const AUTO_PLAY_MS = 3000;

const HeroSlider = () => {
  const { banners: allBanners } = useAdminData();
  const banners = allBanners.filter((b) => b.isActive);
  const [current, setCurrent] = useState(0);
  const [progress, setProgress] = useState(0);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % banners.length);
    setProgress(0);
  }, [banners.length]);

  const prev = useCallback(() => {
    setCurrent((p) => (p - 1 + banners.length) % banners.length);
    setProgress(0);
  }, [banners.length]);

  // Smooth progress timer
  useEffect(() => {
    if (banners.length <= 1) return;
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          next();
          return 0;
        }
        return p + 100 / (AUTO_PLAY_MS / 50);
      });
    }, 50);
    return () => clearInterval(interval);
  }, [current, banners.length, next]);

  if (!banners.length) return null;

  return (
    <section className="home-hero relative w-full overflow-hidden bg-muted">
      {banners.map((banner, i) => (
        <div
          key={banner.id}
          className={cn(
            "absolute inset-0 transition-opacity duration-700",
            i === current
              ? "z-10 opacity-100"
              : "pointer-events-none z-0 opacity-0"
          )}
          aria-hidden={i !== current}
        >
          {/* Hero Image — uses mobile source if available and on small screens */}
          <MediaImage
            src={banner.mobileImageUrl && window.innerWidth < 768 ? banner.mobileImageUrl : banner.desktopImageUrl}
            alt={banner.title || "Banner"}
            className={cn(
              "w-full h-full object-cover transition-transform ease-out",
              i === current
                ? "scale-110 duration-[7000ms]"
                : "scale-100 duration-700"
            )}
            loading={i === current ? "eager" : "lazy"}
            decoding="async"
          />
          <div className="home-hero-overlay absolute inset-0" />
          <div className="absolute inset-0 flex items-center">
            <div className="section-container">
              <div className="home-hero-content" data-animate="hero-slide">
                <p className="home-hero-kicker">Premium Electronics</p>
                <div className={cn("space-y-4", i === current && "animate-hero-float")}>
                  {banner.title && (
                    <h2 className="font-heading text-3xl md:text-5xl lg:text-6xl font-bold text-white leading-tight drop-shadow-sm">
                      {banner.title}
                    </h2>
                  )}
                  {banner.ctaText && banner.ctaLink && (
                    <Link
                      to={banner.ctaLink}
                      className="inline-flex items-center gap-2 rounded-full bg-[hsl(var(--surface-soft-gold))] px-6 py-3 text-sm font-semibold text-foreground transition-all duration-300 hover:bg-[hsl(var(--surface-soft-gold))]/85 hover:scale-[1.03] hover:shadow-lg font-heading"
                    >
                      {banner.ctaText}
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      {banners.length > 1 && (
        <>
          <button
            onClick={prev}
            aria-label="Previous banner"
            className="home-hero-nav absolute left-4 top-1/2 z-20 -translate-y-1/2 rounded-full p-2 transition"
          >
            <ChevronLeft className="h-5 w-5 text-foreground" />
          </button>
          <button
            onClick={next}
            aria-label="Next banner"
            className="home-hero-nav absolute right-4 top-1/2 z-20 -translate-y-1/2 rounded-full p-2 transition"
          >
            <ChevronRight className="h-5 w-5 text-foreground" />
          </button>

          {/* Animated progress bar — replaces vanilla dot indicators */}
          <div className="absolute bottom-0 left-0 right-0 z-20 flex">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  setCurrent(i);
                  setProgress(0);
                }}
                aria-label={`Go to banner ${i + 1}`}
                className="relative flex-1 h-[3px] bg-white/20 overflow-hidden"
              >
                <span
                  className="absolute inset-y-0 left-0 bg-[hsl(var(--surface-soft-gold))]"
                  style={{
                    width:
                      i === current
                        ? `${progress}%`
                        : i < current
                        ? "100%"
                        : "0%",
                    transition: i === current ? "none" : "width 0.3s ease",
                  }}
                />
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
};

export default HeroSlider;
