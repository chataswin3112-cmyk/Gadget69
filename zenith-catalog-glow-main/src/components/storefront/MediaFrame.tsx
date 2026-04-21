import { cn } from "@/lib/utils";
import { resolveMediaUrl } from "@/lib/media";
import { isVideoUrl } from "@/lib/video";
import MediaImage from "@/components/ui/media-image";
import VideoFrame from "@/components/ui/VideoFrame";

interface MediaFrameProps {
  src: string;
  alt: string;
  aspectRatio?: string;
  className?: string;
  padding?: string;
  objectFit?: "contain" | "cover";
  loading?: "lazy" | "eager";
  sizes?: string;
  optimizeWidth?: number;
  optimizeHeight?: number;
  fetchPriority?: "high" | "low" | "auto";
}

const MediaFrame = ({
  src,
  alt,
  aspectRatio = "aspect-square",
  className,
  padding = "p-4",
  objectFit = "contain",
  loading = "lazy",
  sizes,
  optimizeWidth,
  optimizeHeight,
  fetchPriority,
}: MediaFrameProps) => {
  const hasVideo = isVideoUrl(src);

  return (
    <div
      className={cn(
        "media-frame rounded-lg",
        hasVideo && "flex items-center justify-center",
        aspectRatio,
        padding,
        className
      )}
    >
      {hasVideo ? (
      <VideoFrame
        src={resolveMediaUrl(src)}
        title={alt}
        className="rounded-none"
        mediaClassName="rounded-none"
        objectFit={objectFit}
      />
    ) : (
      <MediaImage
        src={src}
        alt={alt}
        className={cn("w-full h-full", objectFit === "contain" ? "object-contain" : "object-cover")}
        loading={loading}
        sizes={sizes}
        optimizeWidth={optimizeWidth}
        optimizeHeight={optimizeHeight}
        fetchPriority={fetchPriority}
      />
    )}
    </div>
  );
};

export default MediaFrame;
