const VIDEO_EXTENSIONS = [".mp4", ".webm", ".ogg", ".mov", ".m4v"];
const DEFAULT_API_BASE_URL = "/api";

export const FALLBACK_IMAGE_SRC = "/placeholder.svg";

export const isVideoUrl = (url?: string | null) => {
  if (!url) return false;
  const normalized = url.toLowerCase();
  return VIDEO_EXTENSIONS.some((extension) => normalized.includes(extension));
};

const resolveApiOrigin = () => {
  const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL;

  try {
    return new URL(configuredApiBaseUrl).origin;
  } catch {
    if (typeof window !== "undefined") {
      return new URL(configuredApiBaseUrl, window.location.origin).origin;
    }
    return "";
  }
};

export const resolveMediaUrl = (url?: string | null) => {
  if (!url) return "";

  const normalized = url.trim();
  if (!normalized) return "";

  if (/^(https?:|data:|blob:)/i.test(normalized)) {
    return normalized;
  }

  if (normalized.startsWith("/uploads/")) {
    const apiOrigin = resolveApiOrigin();
    return apiOrigin ? `${apiOrigin}${normalized}` : normalized;
  }

  return normalized;
};

export const uniqueMediaUrls = (urls: Array<string | null | undefined>) =>
  Array.from(
    new Set(
      urls
        .map((item) => resolveMediaUrl(item))
        .filter((item): item is string => item.trim().length > 0)
    )
  );
