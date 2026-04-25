import apiClient from "./client";
import {
  CatalogMediaUploadSignature,
  Product,
  ProductMedia,
  ProductVariant,
  VariantMedia,
} from "@/types";

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

const inferLocalMediaType = (file: File): "IMAGE" | "VIDEO" =>
  file.type.toLowerCase().startsWith("video/") ? "VIDEO" : "IMAGE";

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
  const storedFile = await uploadAdminFile(file);
  return storedFile.url;
};

export const getCatalogMediaUploadSignature = async (data: {
  fileName: string;
  contentType: string;
  fileSize: number;
  target: "PRODUCT" | "VARIANT";
}): Promise<CatalogMediaUploadSignature> => {
  const res = await apiClient.post("/admin/catalog-media/upload-signature", data);
  return res.data;
};

export const uploadCatalogMediaFile = async (
  file: File,
  target: "PRODUCT" | "VARIANT"
): Promise<{
  secureUrl: string;
  mediaType: "IMAGE" | "VIDEO";
  publicId?: string;
  width?: number;
  height?: number;
  duration?: number;
}> => {
  try {
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
      mediaType: signature.resourceType === "video" ? "VIDEO" : "IMAGE",
      publicId: payload.public_id as string | undefined,
      width: payload.width as number | undefined,
      height: payload.height as number | undefined,
      duration: payload.duration as number | undefined,
    };
  } catch {
    const storedFile = await uploadAdminFile(file);
    return {
      secureUrl: storedFile.url,
      mediaType: inferLocalMediaType(file),
    };
  }
};

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
