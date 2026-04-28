import apiClient from "./client";
import {
  CatalogMediaUploadSignature,
  Product,
  ProductMedia,
  ProductVariant,
  VariantMedia,
} from "@/types";
import { getErrorMessage } from "@/lib/api-error";

export type CatalogMediaUploadTarget =
  | "PRODUCT"
  | "VARIANT"
  | "CATEGORY"
  | "BANNER"
  | "COMMUNITY"
  | "REVIEW"
  | "SETTINGS"
  | "GENERAL";

type CloudinaryResourceType = "image" | "video" | "raw";

export const getProducts = async (): Promise<Product[]> => {
  const res = await apiClient.get("/products");
  return res.data;
};

export const getProductById = async (id: number): Promise<Product> => {
  const res = await apiClient.get(`/products/${id}`);
  return res.data;
};

/** Public: get a single variant with full media list */
export const getVariant = async (id: number): Promise<ProductVariant> => {
  const res = await apiClient.get(`/variants/${id}`);
  return res.data;
};

export const getAdminProducts = async (): Promise<Product[]> => {
  const res = await apiClient.get("/admin/products");
  return res.data;
};

export const createProduct = async (data: Partial<Product>): Promise<Product> => {
  const res = await apiClient.post("/admin/products", data);
  return res.data;
};

export const updateProduct = async (id: number, data: Partial<Product>): Promise<Product> => {
  const res = await apiClient.put(`/admin/products/${id}`, data);
  return res.data;
};

export const deleteProduct = async (id: number): Promise<void> => {
  await apiClient.delete(`/admin/products/${id}`);
};

interface AdminStoredFileResponse {
  url: string;
  fileName: string;
  mediaType: string;
}

export const uploadAdminFile = async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<AdminStoredFileResponse> => {
  const formData = new FormData();
  formData.append("file", file);
  const res = await apiClient.post("/admin/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (event) => {
      if (!onProgress || !event.total) {
        return;
      }
      onProgress((event.loaded / event.total) * 100);
    },
  });
  onProgress?.(100);
  return res.data;
};

export const uploadFile = async (file: File): Promise<string> => {
  const uploaded = await uploadCatalogAssetFile(file, "GENERAL");
  return uploaded.secureUrl;
};

export const getCatalogMediaUploadSignature = async (data: {
  fileName: string;
  contentType: string;
  fileSize: number;
  target: CatalogMediaUploadTarget;
}): Promise<CatalogMediaUploadSignature> => {
  const res = await apiClient.post("/admin/catalog-media/upload-signature", data);
  return res.data;
};

export const uploadCatalogMediaFile = async (
  file: File,
  target: CatalogMediaUploadTarget
): Promise<{
  secureUrl: string;
  mediaType: "IMAGE" | "VIDEO";
  publicId?: string;
  width?: number;
  height?: number;
  duration?: number;
}> => {
  const uploaded = await uploadCatalogAssetFile(file, target);
  if (uploaded.resourceType === "raw") {
    throw new Error("Only image and video uploads are supported here");
  }

  return {
    secureUrl: uploaded.secureUrl,
    mediaType: uploaded.resourceType === "video" ? "VIDEO" : "IMAGE",
    publicId: uploaded.publicId,
    width: uploaded.width,
    height: uploaded.height,
    duration: uploaded.duration,
  };
};

export const uploadCatalogAssetFile = async (
  file: File,
  target: CatalogMediaUploadTarget
): Promise<{
  secureUrl: string;
  resourceType: CloudinaryResourceType;
  publicId?: string;
  width?: number;
  height?: number;
  duration?: number;
}> => {
  validateCatalogUploadFile(file, target);

  try {
    return await uploadCloudinaryCatalogAssetFile(file, target);
  } catch (error) {
    if (shouldUseLocalUploadFallback(error)) {
      try {
        return await uploadLocalCatalogAssetFile(file);
      } catch (fallbackError) {
        throw new Error(getErrorMessage(fallbackError, "Local upload failed"));
      }
    }

    throw new Error(
      getErrorMessage(
        error,
        "Cloudinary upload failed. Configure Cloudinary storage before uploading live admin media."
      )
    );
  }
};

const uploadCloudinaryCatalogAssetFile = async (
  file: File,
  target: CatalogMediaUploadTarget
): Promise<{
  secureUrl: string;
  resourceType: CloudinaryResourceType;
  publicId?: string;
  width?: number;
  height?: number;
  duration?: number;
}> => {
  const signature = await getCatalogMediaUploadSignature({
    fileName: file.name,
    contentType: file.type,
    fileSize: file.size,
    target,
  });

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", signature.apiKey);
  formData.append("timestamp", String(signature.timestamp));
  formData.append("signature", signature.signature);
  formData.append("folder", signature.folder);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${signature.cloudName}/${signature.resourceType}/upload`,
    {
      method: "POST",
      body: formData,
    }
  );
  const payload = await response.json();

  if (!response.ok || !payload.secure_url) {
    throw new Error(payload?.error?.message || "Upload failed");
  }

  return {
    secureUrl: payload.secure_url as string,
    publicId: payload.public_id as string | undefined,
    width: payload.width as number | undefined,
    height: payload.height as number | undefined,
    duration: payload.duration as number | undefined,
    resourceType: signature.resourceType as CloudinaryResourceType,
  };
};

const uploadLocalCatalogAssetFile = async (
  file: File
): Promise<{
  secureUrl: string;
  resourceType: CloudinaryResourceType;
  publicId?: string;
  width?: number;
  height?: number;
  duration?: number;
}> => {
  const uploaded = await uploadAdminFile(file);

  return {
    secureUrl: uploaded.url,
    publicId: uploaded.fileName,
    resourceType: localUploadResourceType(uploaded.mediaType, file),
  };
};

const localUploadResourceType = (
  mediaType: string | undefined,
  file: File
): CloudinaryResourceType => {
  const normalizedMediaType = (mediaType || "").toUpperCase();
  if (normalizedMediaType === "VIDEOS" || file.type.startsWith("video/")) {
    return "video";
  }
  if (normalizedMediaType === "IMAGES" || file.type.startsWith("image/")) {
    return "image";
  }
  return "raw";
};

const shouldUseLocalUploadFallback = (error: unknown) => {
  const status =
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof (error as { response?: { status?: unknown } }).response?.status === "number"
      ? (error as { response: { status: number } }).response.status
      : undefined;

  if (status && status < 500) {
    return false;
  }

  const message = getErrorMessage(error, "").toLowerCase();
  return (
    (status !== undefined && status >= 500) ||
    message.includes("cloudinary") ||
    message.includes("failed to fetch") ||
    message.includes("network")
  );
};

const validateCatalogUploadFile = (file: File, target: CatalogMediaUploadTarget) => {
  const resourceType = detectCatalogResourceType(file);
  const maxBytes =
    resourceType === "image"
      ? 10 * 1024 * 1024
      : resourceType === "video"
        ? 50 * 1024 * 1024
        : 25 * 1024 * 1024;

  if (file.size > maxBytes) {
    throw new Error(
      resourceType === "image"
        ? "Image must be 10 MB or smaller"
        : resourceType === "video"
          ? "Video must be 50 MB or smaller"
          : "File must be 25 MB or smaller"
    );
  }

  if (["PRODUCT", "VARIANT"].includes(target)) {
    if (resourceType !== "image" && resourceType !== "video") {
      throw new Error(`${target === "PRODUCT" ? "Product" : "Variant"} uploads only support images or videos`);
    }
    return;
  }

  if (["CATEGORY", "BANNER", "COMMUNITY", "REVIEW"].includes(target) && resourceType !== "image") {
    const targetLabel = target.charAt(0) + target.slice(1).toLowerCase();
    throw new Error(`${targetLabel} uploads only support images`);
  }

  if (target === "SETTINGS" && resourceType === "video") {
    throw new Error("Settings uploads only support images or PDF files");
  }
};

const detectCatalogResourceType = (file: File): CloudinaryResourceType => {
  const contentType = file.type.trim().toLowerCase();
  const fileName = file.name.trim().toLowerCase();

  if (
    ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif", "image/svg+xml"].includes(contentType) ||
    hasFileExtension(fileName, ".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg")
  ) {
    return "image";
  }

  if (
    ["video/mp4", "video/quicktime", "video/webm"].includes(contentType) ||
    hasFileExtension(fileName, ".mp4", ".mov", ".webm")
  ) {
    return "video";
  }

  if (contentType === "application/pdf" || hasFileExtension(fileName, ".pdf")) {
    return "raw";
  }

  throw new Error("Only jpg, jpeg, png, webp, gif, svg images, mp4, mov, webm videos, and PDF files are supported");
};

const hasFileExtension = (fileName: string, ...extensions: string[]) =>
  extensions.some((extension) => fileName.endsWith(extension));

export const getProductMedia = async (productId: number): Promise<ProductMedia[]> => {
  const res = await apiClient.get(`/admin/products/${productId}/media`);
  return res.data;
};

export const addProductMedia = async (
  productId: number,
  data: Omit<ProductMedia, "id" | "productId">
): Promise<ProductMedia> => {
  const res = await apiClient.post(`/admin/products/${productId}/media`, data);
  return res.data;
};

export const setProductMediaPrimary = async (mediaId: number): Promise<ProductMedia> => {
  const res = await apiClient.put(`/admin/product-media/${mediaId}/primary`, {});
  return res.data;
};

export const deleteProductMedia = async (mediaId: number): Promise<void> => {
  await apiClient.delete(`/admin/product-media/${mediaId}`);
};

// ── Admin Variant APIs ───────────────────────────────────────────────────────

export const getProductVariants = async (productId: number): Promise<ProductVariant[]> => {
  const res = await apiClient.get(`/admin/products/${productId}/variants`);
  return res.data;
};

export const createVariant = async (
  productId: number,
  data: Partial<ProductVariant>
): Promise<ProductVariant> => {
  const res = await apiClient.post(`/admin/products/${productId}/variants`, data);
  return res.data;
};

export const updateVariant = async (
  variantId: number,
  data: Partial<ProductVariant>
): Promise<ProductVariant> => {
  const res = await apiClient.put(`/admin/variants/${variantId}`, data);
  return res.data;
};

export const deleteVariant = async (variantId: number): Promise<void> => {
  await apiClient.delete(`/admin/variants/${variantId}`);
};

export const getVariantMedia = async (variantId: number): Promise<VariantMedia[]> => {
  const res = await apiClient.get(`/admin/variants/${variantId}/media`);
  return res.data;
};

export const addVariantMedia = async (
  variantId: number,
  data: {
    mediaUrl: string;
    mediaType: "IMAGE" | "VIDEO";
    mediaRole: "MAIN" | "SIDE" | "BACK" | "ADDITIONAL";
    displayOrder?: number;
    isPrimary?: boolean;
  }
): Promise<VariantMedia> => {
  const res = await apiClient.post(`/admin/variants/${variantId}/media`, data);
  return res.data;
};

export const setVariantMediaPrimary = async (mediaId: number): Promise<VariantMedia> => {
  const res = await apiClient.put(`/admin/variant-media/${mediaId}/primary`, {});
  return res.data;
};

export const deleteVariantMedia = async (mediaId: number): Promise<void> => {
  await apiClient.delete(`/admin/variant-media/${mediaId}`);
};
