import { type FocusEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAdminData } from "@/contexts/AdminDataContext";
import { resolveMediaUrl, resolveResponsiveMediaUrl } from "@/lib/media";
import { cn } from "@/lib/utils";
import MediaImage from "@/components/ui/media-image";
import { useIsMobile } from "@/hooks/use-mobile";

const AUTO_PLAY_DELAY_MS = 5000;

const HeroSlider = () => {
  const { banners: allBanners } = useAdminData();
  const isMobile = useIsMobile();
  const banners = useMemo(() => allBanners.filter((banner) => banner.isActive), [allBanners]);
  const [current, setCurrent] = useState(0);
  const [isAutoPlayPaused, setIsAutoPlayPaused] = useState(false);
  const currentBanner = banners[current];
  const currentHeroHref = useMemo(() => {
    if (!currentBanner) {
      return "";
    }

    return resolveResponsiveMediaUrl(
      isMobile ? currentBanner.mobileImageUrl || currentBanner.desktopImageUrl : currentBanner.desktopImageUrl,
      {
        width: isMobile ? 720 : 1440,
        height: isMobile ? 540 : 700,
        applyDevicePixelRatio: false,
      }
    );
  }, [currentBanner, isMobile]);
  const renderedSlideIndexes = useMemo(() => {
    if (banners.length <= 1) {
      return new Set([0]);
    }

    return new Set([
      current,
      (current + 1) % banners.length,
      (current - 1 + banners.length) % banners.length,
    ]);
  }, [banners.length, current]);

  const next = useCallback(() => {
    setCurrent((prev) => (banners.length <= 1 ? 0 : (prev + 1) % banners.length));
  }, [banners.length]);

  const prev = useCallback(() => {
    setCurrent((prevIndex) =>
      banners.length <= 1 ? 0 : (prevIndex - 1 + banners.length) % banners.length
    );
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
    if (isMobile || banners.length <= 1 || isAutoPlayPaused) {
      return;
    }

    const timer = window.setInterval(next, AUTO_PLAY_DELAY_MS);

    return () => {
      window.clearInterval(timer);
    };
  }, [banners.length, isAutoPlayPaused, isMobile, next]);

  useEffect(() => {
    if (!currentHeroHref || typeof document === "undefined") {
      return;
    }

    const normalizedHref = new URL(currentHeroHref, document.baseURI).href;
    const existingLink = Array.from(
      document.head.querySelectorAll<HTMLLinkElement>('link[data-hero-preload="true"]')
    ).find((candidate) => candidate.href === normalizedHref);
    if (existingLink) {
      return;
    }

    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.href = currentHeroHref;
    link.setAttribute("fetchpriority", "high");
    link.setAttribute("data-hero-preload", "true");
    document.head.appendChild(link);

    return () => {
      link.remove();
    };
  }, [currentHeroHref]);

  const pauseAutoPlay = () => {
    setIsAutoPlayPaused(true);
  };

  const resumeAutoPlay = () => {
    setIsAutoPlayPaused(false);
  };

  const handleBlurCapture = (event: FocusEvent<HTMLElement>) => {
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
      return;
    }

    resumeAutoPlay();
  };

  if (!banners.length) {
    return null;
  }

  return (
    <section
      data-testid="hero-slider"
      className="home-hero relative w-full overflow-hidden bg-muted"
      onMouseEnter={pauseAutoPlay}
      onMouseLeave={resumeAutoPlay}
      onFocusCapture={pauseAutoPlay}
      onBlurCapture={handleBlurCapture}
    >
      {banners.map((banner, index) => {
        if (!renderedSlideIndexes.has(index)) {
          return null;
        }

        const mobileSrc = resolveMediaUrl(banner.mobileImageUrl);
        const mobileSrcSet = banner.mobileImageUrl
          ? [
              resolveResponsiveMediaUrl(banner.mobileImageUrl, {
                width: 360,
                height: 270,
                applyDevicePixelRatio: false,
              }),
              resolveResponsiveMediaUrl(banner.mobileImageUrl, {
                width: 720,
                height: 540,
                applyDevicePixelRatio: false,
              }),
            ]
              .filter(Boolean)
              .map((url, sourceIndex) => `${url} ${sourceIndex === 0 ? 360 : 720}w`)
              .join(", ")
          : "";

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
              {mobileSrc && (
                <source
                  media="(max-width: 767px)"
                  srcSet={mobileSrcSet || mobileSrc}
                  sizes="100vw"
                />
              )}
              <MediaImage
                src={banner.desktopImageUrl}
                alt={banner.title || "Banner"}
                className="h-full w-full object-cover"
                loading={index === current ? "eager" : "lazy"}
                decoding="async"
                fetchPriority={index === current ? "high" : undefined}
                sizes="100vw"
                optimizeWidth={isMobile ? 360 : 720}
                optimizeHeight={isMobile ? 270 : 700}
              />
            </picture>
            <div className="home-hero-overlay absolute inset-0" />
            <div className="absolute inset-0 flex items-center">
              <div className="section-container">
                <div className="home-hero-content">
                  <p className="home-hero-kicker">Premium Electronics</p>
                  <div className="space-y-3 sm:space-y-4">
                    {banner.title && (
                      <h2 className="font-heading text-xl font-bold leading-tight text-white drop-shadow-sm sm:text-3xl md:text-5xl lg:text-6xl">
                        {banner.title}
                      </h2>
                    )}
                    {banner.ctaText && banner.ctaLink && (
                      <Link
                        to={banner.ctaLink}
                        className="inline-flex items-center gap-2 rounded-full bg-[hsl(var(--surface-soft-gold))] px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-[hsl(var(--surface-soft-gold))]/85 sm:px-6 sm:py-3 sm:text-sm font-heading"
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
            className="home-hero-nav absolute left-3 top-1/2 z-20 -translate-y-1/2 rounded-full p-2 transition-colors sm:left-4"
          >
            <ChevronLeft className="h-5 w-5 text-foreground" />
          </button>
          <button
            onClick={next}
            aria-label="Next banner"
            className="home-hero-nav absolute right-3 top-1/2 z-20 -translate-y-1/2 rounded-full p-2 transition-colors sm:right-4"
          >
            <ChevronRight className="h-5 w-5 text-foreground" />
          </button>

          <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/18 px-3 py-2 backdrop-blur-sm">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrent(index)}
                aria-label={`Go to banner ${index + 1}`}
                className={cn(
                  "home-hero-dot h-2.5 w-2.5 rounded-full bg-white/35 transition-colors",
                  index === current && "bg-[hsl(var(--surface-soft-gold))]"
                )}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
};

export default HeroSlider;
