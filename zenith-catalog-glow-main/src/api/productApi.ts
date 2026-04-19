import apiClient from "./client";
import { Product, ProductVariant, VariantMedia } from "@/types";

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

export const uploadFile = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);
  const res = await apiClient.post("/admin/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data.url;
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
  data: { mediaUrl: string; mediaType: "IMAGE" | "VIDEO"; displayOrder?: number; isPrimary?: boolean }
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
