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
      optimizeWidth,
      optimizeHeight,
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

    useEffect(() => {
      setCurrentSrc(resolvedSrc);
    }, [resolvedSrc]);

    return (
      <img
        {...props}
        ref={ref}
        src={currentSrc}
        loading={loading ?? (eager ? "eager" : "lazy")}
        decoding={decoding ?? (eager ? "sync" : "async")}
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
