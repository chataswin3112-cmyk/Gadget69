import { ComponentPropsWithoutRef, forwardRef, useEffect, useMemo, useState } from "react";
import { FALLBACK_IMAGE_SRC, resolveResponsiveMediaUrl } from "@/lib/media";

interface MediaImageProps extends Omit<ComponentPropsWithoutRef<"img">, "src"> {
  src?: string | null;
  fallbackSrc?: string;
  /** Set eager=true for hero/above-the-fold images to skip lazy loading */
  eager?: boolean;
  optimizeWidth?: number;
  optimizeHeight?: number;
}

const buildResponsiveSrcSet = (
  src: string | null | undefined,
  options: {
    width?: number;
    height?: number;
  }
) => {
  if (typeof options.width !== "number" || options.width <= 0) {
    return undefined;
  }

  const baseWidth = Math.round(options.width);
  const candidateWidths = Array.from(
    new Set([baseWidth, Math.min(baseWidth * 2, 1920)].filter((width) => width > 0))
  );

  const entries = candidateWidths
    .map((width) => {
      const ratio = width / baseWidth;
      const height =
        typeof options.height === "number" && options.height > 0
          ? Math.round(options.height * ratio)
          : undefined;
      const url = resolveResponsiveMediaUrl(src, {
        width,
        height,
        applyDevicePixelRatio: false,
      });
      return url ? { url, width } : null;
    })
    .filter((entry): entry is { url: string; width: number } => Boolean(entry));

  if (new Set(entries.map((entry) => entry.url)).size < 2) {
    return undefined;
  }

  return entries.map((entry) => `${entry.url} ${entry.width}w`).join(", ");
};

const MediaImage = forwardRef<HTMLImageElement, MediaImageProps>(
  (
    {
      src,
      fallbackSrc = FALLBACK_IMAGE_SRC,
      onError,
      eager = false,
      loading,
      decoding,
      fetchPriority,
      referrerPolicy,
      optimizeWidth,
      optimizeHeight,
      sizes,
      srcSet,
      ...props
    },
    ref
  ) => {
    const resolvedFallbackSrc = useMemo(
      () =>
        resolveResponsiveMediaUrl(fallbackSrc, {
          width: optimizeWidth,
          height: optimizeHeight,
        }) || FALLBACK_IMAGE_SRC,
      [fallbackSrc, optimizeHeight, optimizeWidth]
    );
    const resolvedSrc = useMemo(
      () =>
        resolveResponsiveMediaUrl(
          src,
          {
            width: optimizeWidth,
            height: optimizeHeight,
          }
        ) || resolvedFallbackSrc,
      [optimizeHeight, optimizeWidth, resolvedFallbackSrc, src]
    );
    const [currentSrc, setCurrentSrc] = useState(resolvedSrc);
    const resolvedSrcSet = useMemo(
      () =>
        sizes
          ? buildResponsiveSrcSet(src, {
              width: optimizeWidth,
              height: optimizeHeight,
            })
          : undefined,
      [optimizeHeight, optimizeWidth, sizes, src]
    );
    const resolvedFallbackSrcSet = useMemo(
      () =>
        sizes
          ? buildResponsiveSrcSet(fallbackSrc, {
              width: optimizeWidth,
              height: optimizeHeight,
            })
          : undefined,
      [fallbackSrc, optimizeHeight, optimizeWidth, sizes]
    );

    useEffect(() => {
      setCurrentSrc(resolvedSrc);
    }, [resolvedSrc]);

    return (
      <img
        {...props}
        ref={ref}
        src={currentSrc}
        srcSet={srcSet ?? (currentSrc === resolvedSrc ? resolvedSrcSet : resolvedFallbackSrcSet)}
        sizes={sizes}
        loading={loading ?? (eager ? "eager" : "lazy")}
        decoding={decoding ?? (eager ? "sync" : "async")}
        referrerPolicy={referrerPolicy ?? (/^https?:/i.test(currentSrc) ? "no-referrer" : undefined)}
        {...(fetchPriority ? { fetchpriority: fetchPriority } : {})}
        onError={(event) => {
          onError?.(event);

          if (currentSrc !== resolvedFallbackSrc) {
            setCurrentSrc(resolvedFallbackSrc);
          }
        }}
      />
    );
  }
);

MediaImage.displayName = "MediaImage";

export default MediaImage;
