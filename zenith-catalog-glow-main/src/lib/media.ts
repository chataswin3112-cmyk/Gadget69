const VIDEO_EXTENSIONS = [".mp4", ".webm", ".ogg", ".mov", ".m4v"];
const DEFAULT_API_BASE_URL = "/api";
const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

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

const resolveCurrentOrigin = () => {
  if (typeof window === "undefined") {
    return "";
  }
  return window.location.origin;
};

const normalizeHostname = (hostname: string) => hostname.replace(/^\[(.*)\]$/, "$1").toLowerCase();

const isIpv4Address = (hostname: string) => /^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname);

const isPrivateNetworkHost = (hostname: string) => {
  const normalized = normalizeHostname(hostname);
  if (!normalized) {
    return false;
  }

  if (LOOPBACK_HOSTS.has(normalized) || normalized.endsWith(".local")) {
    return true;
  }

  if (!isIpv4Address(normalized)) {
    return false;
  }

  const octets = normalized.split(".").map((segment) => Number(segment));
  if (octets.some((segment) => Number.isNaN(segment) || segment < 0 || segment > 255)) {
    return false;
  }

  return (
    octets[0] === 10 ||
    octets[0] === 127 ||
    (octets[0] === 169 && octets[1] === 254) ||
    (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) ||
    (octets[0] === 192 && octets[1] === 168)
  );
};

const isUnsafeAbsoluteMediaUrl = (candidateUrl: string, currentOrigin = resolveCurrentOrigin()) => {
  try {
    const candidate = new URL(candidateUrl);
    if (!/^https?:$/i.test(candidate.protocol)) {
      return false;
    }

    const apiOrigin = resolveApiOrigin();
    const allowedPrivateOrigins = new Set([currentOrigin, apiOrigin].filter(Boolean));

    if (currentOrigin) {
      const current = new URL(currentOrigin);
      if (current.protocol === "https:" && candidate.protocol === "http:") {
        return true;
      }

      if (isPrivateNetworkHost(candidate.hostname)) {
        if (!isPrivateNetworkHost(current.hostname)) {
          return true;
        }
        return !allowedPrivateOrigins.has(candidate.origin);
      }
    }

    return false;
  } catch {
    return false;
  }
};

export const resolveMediaUrl = (url?: string | null, currentOrigin = resolveCurrentOrigin()) => {
  if (!url) return "";

  const normalized = url.trim();
  if (!normalized) return "";

  if (/^(https?:|data:|blob:)/i.test(normalized)) {
    return isUnsafeAbsoluteMediaUrl(normalized, currentOrigin) ? "" : normalized;
  }

  if (normalized.startsWith("/uploads/")) {
    const apiOrigin = resolveApiOrigin();
    const resolvedUploadUrl = apiOrigin ? `${apiOrigin}${normalized}` : normalized;
    if (/^(https?:|data:|blob:)/i.test(resolvedUploadUrl)) {
      return isUnsafeAbsoluteMediaUrl(resolvedUploadUrl, currentOrigin) ? "" : resolvedUploadUrl;
    }
    return resolvedUploadUrl;
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
