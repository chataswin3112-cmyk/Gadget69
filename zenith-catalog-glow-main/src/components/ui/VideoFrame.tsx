import { cn } from "@/lib/utils";
import { resolveMediaUrl } from "@/lib/media";
import { resolveVideoSource } from "@/lib/video";

interface VideoFrameProps {
  src?: string | null;
  title?: string;
  poster?: string;
  videoPublicId?: string | null;
  className?: string;
  mediaClassName?: string;
  controls?: boolean;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  testId?: string;
  objectFit?: "contain" | "cover";
}

const VideoFrame = ({
  src,
  title,
  poster,
  videoPublicId,
  className,
  mediaClassName,
  controls = true,
  autoPlay = false,
  muted = false,
  loop = false,
  testId,
  objectFit = "contain",
}: VideoFrameProps) => {
  const resolvedVideoSource = resolveVideoSource({ url: src, videoPublicId });

  if (!resolvedVideoSource) {
    return null;
  }

  const resolvedPoster = resolveMediaUrl(poster);

  return (
    <div
      data-testid={testId}
      className={cn("aspect-video w-full overflow-hidden rounded-lg bg-black", className)}
    >
      {resolvedVideoSource.kind === "embed" ? (
        <iframe
          src={resolvedVideoSource.src}
          title={title || "Embedded video"}
          className={cn("h-full w-full border-0 bg-black", mediaClassName)}
          loading="lazy"
          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      ) : (
        <video
          src={resolvedVideoSource.src}
          poster={resolvedPoster || undefined}
          className={cn(
            "h-full w-full bg-black",
            objectFit === "contain" ? "object-contain" : "object-cover",
            mediaClassName
          )}
          controls={controls}
          autoPlay={autoPlay}
          muted={muted}
          loop={loop}
          playsInline
          preload={controls ? "metadata" : "none"}
        />
      )}
    </div>
  );
};

export default VideoFrame;
