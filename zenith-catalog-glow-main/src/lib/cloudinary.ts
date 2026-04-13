import { FALLBACK_IMAGE_SRC, resolveMediaUrl } from "@/lib/media";

const DEFAULT_POSTER_WIDTH = 1280;
const DEFAULT_POSTER_HEIGHT = 720;
const DEFAULT_VIDEO_WIDTH = 1600;

const encodePublicId = (publicId: string) =>
  publicId
    .split("/")
    .filter((segment) => segment.trim().length > 0)
    .map((segment) => encodeURIComponent(segment))
    .join("/");

export const extractCloudinaryCloudName = (url?: string | null) => {
  if (!url) return "";

  try {
    const parsedUrl = new URL(resolveMediaUrl(url));
    const pathParts = parsedUrl.pathname.split("/").filter(Boolean);

    if (parsedUrl.hostname === "res.cloudinary.com") {
      return pathParts[0] || "";
    }

    if (parsedUrl.hostname === "api.cloudinary.com") {
      return pathParts[1] || "";
    }
  } catch {
    return "";
  }

  return "";
};

export const buildCloudinaryPosterUrl = ({
  publicId,
  cloudName,
  width = DEFAULT_POSTER_WIDTH,
  height = DEFAULT_POSTER_HEIGHT,
}: {
  publicId?: string | null;
  cloudName?: string | null;
  width?: number;
  height?: number;
}) => {
  if (!publicId || !cloudName) {
    return "";
  }

  return `https://res.cloudinary.com/${cloudName}/video/upload/c_fill,g_auto,h_${height},w_${width},so_0/${encodePublicId(publicId)}.jpg`;
};

export const buildCloudinaryVideoUrl = ({
  publicId,
  cloudName,
  width = DEFAULT_VIDEO_WIDTH,
}: {
  publicId?: string | null;
  cloudName?: string | null;
  width?: number;
}) => {
  if (!publicId || !cloudName) {
    return "";
  }

  return `https://res.cloudinary.com/${cloudName}/video/upload/c_limit,f_auto,q_auto:good,w_${width}/${encodePublicId(publicId)}`;
};

export const resolveCommunityVideoPoster = ({
  videoPublicId,
  videoUrl,
  thumbnailUrl,
  imageUrl,
  width = DEFAULT_POSTER_WIDTH,
  height = DEFAULT_POSTER_HEIGHT,
}: {
  videoPublicId?: string | null;
  videoUrl?: string | null;
  thumbnailUrl?: string | null;
  imageUrl?: string | null;
  width?: number;
  height?: number;
}) => {
  if (thumbnailUrl) {
    return resolveMediaUrl(thumbnailUrl) || FALLBACK_IMAGE_SRC;
  }

  const cloudName = extractCloudinaryCloudName(videoUrl);
  if (videoPublicId && cloudName) {
    return buildCloudinaryPosterUrl({ publicId: videoPublicId, cloudName, width, height });
  }

  return resolveMediaUrl(imageUrl) || FALLBACK_IMAGE_SRC;
};

export const resolveCommunityVideoUrl = ({
  videoPublicId,
  videoUrl,
  width = DEFAULT_VIDEO_WIDTH,
}: {
  videoPublicId?: string | null;
  videoUrl?: string | null;
  width?: number;
}) => {
  const cloudName = extractCloudinaryCloudName(videoUrl);
  if (videoPublicId && cloudName) {
    return buildCloudinaryVideoUrl({ publicId: videoPublicId, cloudName, width });
  }

  return resolveMediaUrl(videoUrl);
};

export const readVideoMetadata = (file: File) =>
  new Promise<{ width: number; height: number; duration: number }>((resolve, reject) => {
    const video = document.createElement("video");
    const objectUrl = URL.createObjectURL(file);

    const cleanup = () => {
      URL.revokeObjectURL(objectUrl);
      video.removeAttribute("src");
      video.load();
    };

    video.preload = "metadata";
    video.onloadedmetadata = () => {
      resolve({
        width: video.videoWidth,
        height: video.videoHeight,
        duration: Number.isFinite(video.duration) ? video.duration : 0,
      });
      cleanup();
    };
    video.onerror = () => {
      cleanup();
      reject(new Error("Unable to read video metadata"));
    };
    video.src = objectUrl;
  });
