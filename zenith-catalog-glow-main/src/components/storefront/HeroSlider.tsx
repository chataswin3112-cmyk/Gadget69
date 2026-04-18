import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAdminData } from "@/contexts/AdminDataContext";
import { resolveMediaUrl } from "@/lib/media";
import { cn } from "@/lib/utils";
import MediaImage from "@/components/ui/media-image";

const AUTO_PLAY_MS = 3000;

const HeroSlider = () => {
  const { banners: allBanners } = useAdminData();
  const banners = useMemo(() => allBanners.filter((banner) => banner.isActive), [allBanners]);
  const [current, setCurrent] = useState(0);
  const [progressActive, setProgressActive] = useState(false);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % banners.length);
  }, [banners.length]);

  const prev = useCallback(() => {
    setCurrent((prevIndex) => (prevIndex - 1 + banners.length) % banners.length);
  }, [banners.length]);

  useEffect(() => {
    if (!banners.length) {
      setCurrent(0);
      return;
    }

    if (current >= banners.length) {
      setCurrent(0);
    }
  }, [banners.length, current]);

  useEffect(() => {
    if (banners.length <= 1) {
      setProgressActive(false);
      return;
    }

    setProgressActive(false);
    const animationFrameId = window.requestAnimationFrame(() => {
      setProgressActive(true);
    });
    const timeoutId = window.setTimeout(() => {
      next();
    }, AUTO_PLAY_MS);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      window.clearTimeout(timeoutId);
    };
  }, [current, banners.length, next]);

  if (!banners.length) {
    return null;
  }

  return (
    <section className="home-hero relative w-full overflow-hidden bg-muted">
      {banners.map((banner, index) => {
        const mobileSrc = resolveMediaUrl(banner.mobileImageUrl);

        return (
          <div
            key={banner.id}
            className={cn(
              "absolute inset-0 transition-opacity duration-700",
              index === current ? "z-10 opacity-100" : "pointer-events-none z-0 opacity-0"
            )}
            aria-hidden={index !== current}
          >
            <picture>
              {mobileSrc && <source media="(max-width: 767px)" srcSet={mobileSrc} />}
              <MediaImage
                src={banner.desktopImageUrl}
                alt={banner.title || "Banner"}
                className={cn(
                  "h-full w-full object-cover transition-transform ease-out",
                  index === current ? "scale-110" : "scale-100"
                )}
                style={{ transitionDuration: index === current ? "7000ms" : "700ms" }}
                loading={index === current ? "eager" : "lazy"}
                decoding="async"
                fetchPriority={index === current ? "high" : undefined}
                sizes="100vw"
              />
            </picture>
            <div className="home-hero-overlay absolute inset-0" />
            <div className="absolute inset-0 flex items-center">
              <div className="section-container">
                <div className="home-hero-content" data-animate="hero-slide">
                  <p className="home-hero-kicker">Premium Electronics</p>
                  <div className={cn("space-y-3 sm:space-y-4", index === current && "animate-hero-float")}>
                    {banner.title && (
                      <h2 className="font-heading text-xl font-bold leading-tight text-white drop-shadow-sm sm:text-3xl md:text-5xl lg:text-6xl">
                        {banner.title}
                      </h2>
                    )}
                    {banner.ctaText && banner.ctaLink && (
                      <Link
                        to={banner.ctaLink}
                        className="inline-flex items-center gap-2 rounded-full bg-[hsl(var(--surface-soft-gold))] px-4 py-2 text-xs font-semibold text-foreground transition-all duration-300 hover:scale-[1.03] hover:bg-[hsl(var(--surface-soft-gold))]/85 hover:shadow-lg sm:px-6 sm:py-3 sm:text-sm font-heading"
                      >
                        {banner.ctaText}
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}

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

          <div className="absolute bottom-0 left-0 right-0 z-20 flex">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrent(index)}
                aria-label={`Go to banner ${index + 1}`}
                className="relative h-[3px] flex-1 overflow-hidden bg-white/20"
              >
                <span
                  className="absolute inset-y-0 left-0 bg-[hsl(var(--surface-soft-gold))]"
                  style={{
                    width:
                      index === current
                        ? progressActive
                          ? "100%"
                          : "0%"
                        : index < current
                        ? "100%"
                        : "0%",
                    transition:
                      index === current
                        ? `width ${AUTO_PLAY_MS}ms linear`
                        : "width 0.3s ease",
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
