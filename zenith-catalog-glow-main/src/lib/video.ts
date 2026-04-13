import { buildCloudinaryVideoUrl, extractCloudinaryCloudName } from "@/lib/cloudinary";
import { resolveMediaUrl } from "@/lib/media";

const VIDEO_EXTENSIONS = [".mp4", ".webm", ".ogg", ".mov", ".m4v"];

export type VideoProvider = "cloudinary" | "direct" | "youtube" | "instagram" | "none";

export type ResolvedVideoSource =
  | {
      kind: "native";
      provider: Exclude<VideoProvider, "youtube" | "instagram" | "none">;
      src: string;
    }
  | {
      kind: "embed";
      provider: Extract<VideoProvider, "youtube" | "instagram">;
      src: string;
    };

const normalizeVideoUrl = (url?: string | null) => {
  if (!url) {
    return "";
  }

  return resolveMediaUrl(url).trim();
};

const getParsedUrl = (url?: string | null) => {
  const normalizedUrl = normalizeVideoUrl(url);
  if (!normalizedUrl) {
    return null;
  }

  try {
    return new URL(normalizedUrl, "http://localhost");
  } catch {
    return null;
  }
};

const isCloudinaryVideoUrl = (url?: string | null) => {
  const parsedUrl = getParsedUrl(url);
  if (!parsedUrl) {
    return false;
  }

  return parsedUrl.hostname === "res.cloudinary.com" && parsedUrl.pathname.includes("/video/upload/");
};

const hasNativeVideoExtension = (url?: string | null) => {
  const normalizedUrl = normalizeVideoUrl(url).toLowerCase();
  if (!normalizedUrl) {
    return false;
  }

  return VIDEO_EXTENSIONS.some((extension) =>
    normalizedUrl.includes(`${extension}?`) || normalizedUrl.includes(`${extension}#`) || normalizedUrl.endsWith(extension)
  );
};

const extractYoutubeVideoId = (url?: string | null) => {
  const parsedUrl = getParsedUrl(url);
  if (!parsedUrl) {
    return "";
  }

  const host = parsedUrl.hostname.replace(/^www\./, "");
  const segments = parsedUrl.pathname.split("/").filter(Boolean);

  if (host === "youtu.be") {
    return segments[0] || "";
  }

  if (host === "youtube.com" || host === "m.youtube.com") {
    if (segments[0] === "watch") {
      return parsedUrl.searchParams.get("v") || "";
    }
    if (segments[0] === "embed" || segments[0] === "shorts" || segments[0] === "live") {
      return segments[1] || "";
    }
  }

  return "";
};

const extractInstagramMedia = (url?: string | null) => {
  const parsedUrl = getParsedUrl(url);
  if (!parsedUrl) {
    return null;
  }

  const host = parsedUrl.hostname.replace(/^www\./, "");
  if (host !== "instagram.com") {
    return null;
  }

  const segments = parsedUrl.pathname.split("/").filter(Boolean);
  const mediaType = segments[0];
  const mediaId = segments[1] || "";

  if (!mediaId) {
    return null;
  }

  if (mediaType === "reel" || mediaType === "reels") {
    return { mediaType: "reel" as const, mediaId };
  }

  if (mediaType === "p") {
    return { mediaType: "p" as const, mediaId };
  }

  return null;
};

export const getVideoProvider = (url?: string | null): VideoProvider => {
  if (!normalizeVideoUrl(url)) {
    return "none";
  }

  if (extractYoutubeVideoId(url)) {
    return "youtube";
  }

  if (extractInstagramMedia(url)) {
    return "instagram";
  }

  if (isCloudinaryVideoUrl(url)) {
    return "cloudinary";
  }

  if (hasNativeVideoExtension(url)) {
    return "direct";
  }

  return "none";
};

export const isVideoUrl = (url?: string | null) => getVideoProvider(url) !== "none";

export const resolveVideoSource = ({
  url,
  videoPublicId,
  width = 1600,
}: {
  url?: string | null;
  videoPublicId?: string | null;
  width?: number;
}): ResolvedVideoSource | null => {
  const provider = getVideoProvider(url);

  if (provider === "none") {
    return null;
  }

  if (provider === "youtube") {
    const videoId = extractYoutubeVideoId(url);
    if (!videoId) {
      return null;
    }

    return {
      kind: "embed",
      provider,
      src: `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`,
    };
  }

  if (provider === "instagram") {
    const media = extractInstagramMedia(url);
    if (!media) {
      return null;
    }

    return {
      kind: "embed",
      provider,
      src: `https://www.instagram.com/${media.mediaType}/${media.mediaId}/embed`,
    };
  }

  if (provider === "cloudinary") {
    const cloudName = extractCloudinaryCloudName(url);
    if (cloudName && videoPublicId) {
      return {
        kind: "native",
        provider,
        src: buildCloudinaryVideoUrl({ publicId: videoPublicId, cloudName, width }),
      };
    }
  }

  return {
    kind: "native",
    provider: provider === "cloudinary" ? "cloudinary" : "direct",
    src: normalizeVideoUrl(url),
  };
};

export const resolveVideoPosterUrl = (url?: string | null) => {
  const videoId = extractYoutubeVideoId(url);
  if (videoId) {
    return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
  }

  return "";
};
