import { ComponentPropsWithoutRef, forwardRef, useEffect, useMemo, useState } from "react";
import { FALLBACK_IMAGE_SRC, resolveMediaUrl } from "@/lib/media";

interface MediaImageProps extends Omit<ComponentPropsWithoutRef<"img">, "src"> {
  src?: string | null;
  fallbackSrc?: string;
}

const MediaImage = forwardRef<HTMLImageElement, MediaImageProps>(
  ({ src, fallbackSrc = FALLBACK_IMAGE_SRC, onError, ...props }, ref) => {
    const resolvedFallbackSrc = useMemo(
      () => resolveMediaUrl(fallbackSrc) || FALLBACK_IMAGE_SRC,
      [fallbackSrc]
    );
    const resolvedSrc = useMemo(
      () => resolveMediaUrl(src) || resolvedFallbackSrc,
      [resolvedFallbackSrc, src]
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
