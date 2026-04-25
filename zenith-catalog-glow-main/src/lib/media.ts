const VIDEO_EXTENSIONS = [".mp4", ".webm", ".ogg", ".mov", ".m4v"];
const DEFAULT_API_BASE_URL = "/api";
const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);
const CLOUDINARY_HOST = "res.cloudinary.com";
const UNSPLASH_HOSTS = new Set(["images.unsplash.com", "plus.unsplash.com"]);
const UNSPLASH_PATH_ALIASES = new Map([
  ["/photo-1590658268037-6bf12f032f55", "/photo-1606220588913-b3aacb4d2f46"],
]);

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

    if (candidate.pathname === "/" && !candidate.search && !candidate.hash) {
      return true;
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

const optimizeCloudinaryUrl = (
  candidateUrl: string,
  options?: {
    width?: number;
    height?: number;
    applyDevicePixelRatio?: boolean;
  }
) => {
  try {
    const parsed = new URL(candidateUrl);
    if (parsed.hostname !== CLOUDINARY_HOST) {
      return candidateUrl;
    }

    const segments = parsed.pathname.split("/");
    const uploadIndex = segments.findIndex((segment, index) => index >= 2 && segment === "upload");
    if (uploadIndex === -1) {
      return candidateUrl;
    }

    const nextSegment = segments[uploadIndex + 1] || "";
    const hasTransformations = nextSegment.includes(",") || nextSegment.includes("_");
    if (hasTransformations) {
      return candidateUrl;
    }

    const resourceType = segments[uploadIndex - 1];
    const transforms =
      resourceType === "video"
        ? ["f_auto", "q_auto", "vc_auto"]
        : ["c_limit", "f_auto", "q_auto", "dpr_auto"];

    if (typeof options?.width === "number" && options.width > 0) {
      transforms.push(`w_${Math.round(options.width)}`);
    }

    if (typeof options?.height === "number" && options.height > 0) {
      transforms.push(`h_${Math.round(options.height)}`);
    }

    segments.splice(uploadIndex + 1, 0, transforms.join(","));
    parsed.pathname = segments.join("/");
    return parsed.toString();
  } catch {
    return candidateUrl;
  }
};

const optimizeUnsplashUrl = (
  candidateUrl: string,
  options?: {
    width?: number;
    height?: number;
    applyDevicePixelRatio?: boolean;
  }
) => {
  try {
    const parsed = new URL(candidateUrl);
    if (!UNSPLASH_HOSTS.has(parsed.hostname)) {
      return candidateUrl;
    }

    const aliasedPath = UNSPLASH_PATH_ALIASES.get(parsed.pathname);
    if (aliasedPath) {
      parsed.pathname = aliasedPath;
    }

    const shouldApplyDevicePixelRatio = options?.applyDevicePixelRatio !== false;
    const devicePixelRatio =
      shouldApplyDevicePixelRatio && typeof window !== "undefined"
        ? Math.min(window.devicePixelRatio || 1, 2)
        : 1;
    const targetWidth =
      typeof options?.width === "number" && options.width > 0
        ? Math.max(1, Math.round(options.width * devicePixelRatio))
        : null;
    const targetHeight =
      typeof options?.height === "number" && options.height > 0
        ? Math.max(1, Math.round(options.height * devicePixelRatio))
        : null;

    if (targetWidth) {
      parsed.searchParams.set("w", String(targetWidth));
    }

    if (targetHeight) {
      parsed.searchParams.set("h", String(targetHeight));
    }

    if (!parsed.searchParams.has("auto")) {
      parsed.searchParams.set("auto", "format");
    }

    if (!parsed.searchParams.has("q")) {
      parsed.searchParams.set("q", "62");
    }

    return parsed.toString();
  } catch {
    return candidateUrl;
  }
};

const resolveNormalizedMediaUrl = (
  url?: string | null,
  currentOrigin = resolveCurrentOrigin(),
  options?: {
    width?: number;
    height?: number;
    applyDevicePixelRatio?: boolean;
  }
) => {
  if (!url) return "";

  const normalized = url.trim();
  if (!normalized) return "";

  if (/^(https?:|data:|blob:)/i.test(normalized)) {
    if (isUnsafeAbsoluteMediaUrl(normalized, currentOrigin)) {
      return "";
    }
    return optimizeUnsplashUrl(optimizeCloudinaryUrl(normalized, options), options);
  }

  if (normalized.startsWith("/uploads/")) {
    const apiOrigin = resolveApiOrigin();
    const resolvedUploadUrl = apiOrigin ? `${apiOrigin}${normalized}` : normalized;
    if (/^(https?:|data:|blob:)/i.test(resolvedUploadUrl)) {
      return isUnsafeAbsoluteMediaUrl(resolvedUploadUrl, currentOrigin)
        ? ""
        : resolvedUploadUrl;
    }
    return resolvedUploadUrl;
  }

  return normalized;
};

export const resolveMediaUrl = (url?: string | null, currentOrigin = resolveCurrentOrigin()) => {
  return resolveNormalizedMediaUrl(url, currentOrigin);
};

export const resolveResponsiveMediaUrl = (
  url?: string | null,
  options?: {
    width?: number;
    height?: number;
    applyDevicePixelRatio?: boolean;
  },
  currentOrigin = resolveCurrentOrigin()
) => resolveNormalizedMediaUrl(url, currentOrigin, options);

export const uniqueMediaUrls = (urls: Array<string | null | undefined>) =>
  Array.from(
    new Set(
      urls
        .map((item) => resolveMediaUrl(item))
        .filter((item): item is string => item.trim().length > 0)
    )
  );
