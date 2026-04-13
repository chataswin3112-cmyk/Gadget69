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

const getEmbedPlaybackSrc = ({
  src,
  provider,
  autoPlay,
  muted,
  loop,
}: {
  src: string;
  provider: "youtube" | "instagram";
  autoPlay: boolean;
  muted: boolean;
  loop: boolean;
}) => {
  if (!autoPlay && !muted && !loop) {
    return src;
  }

  try {
    const url = new URL(src);

    if (provider === "youtube") {
      if (autoPlay) {
        url.searchParams.set("autoplay", "1");
        url.searchParams.set("playsinline", "1");
      }
      if (muted) {
        url.searchParams.set("mute", "1");
      }
      if (loop) {
        const videoId = url.pathname.split("/").filter(Boolean).pop();
        if (videoId) {
          url.searchParams.set("loop", "1");
          url.searchParams.set("playlist", videoId);
        }
      }
      return url.toString();
    }

    if (provider === "instagram" && autoPlay) {
      url.searchParams.set("autoplay", "1");
    }

    return url.toString();
  } catch {
    return src;
  }
};

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
  const embedPlaybackSrc =
    resolvedVideoSource.kind === "embed"
      ? getEmbedPlaybackSrc({
          src: resolvedVideoSource.src,
          provider: resolvedVideoSource.provider,
          autoPlay,
          muted,
          loop,
        })
      : null;

  return (
    <div
      data-testid={testId}
      className={cn("aspect-video w-full overflow-hidden rounded-lg bg-black", className)}
    >
      {resolvedVideoSource.kind === "embed" ? (
        <iframe
          src={embedPlaybackSrc || resolvedVideoSource.src}
          title={title || "Embedded video"}
          className={cn("h-full w-full border-0 bg-black", mediaClassName)}
          loading={autoPlay ? "eager" : "lazy"}
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
          preload={autoPlay ? "auto" : controls ? "metadata" : "none"}
        />
      )}
    </div>
  );
};

export default VideoFrame;
