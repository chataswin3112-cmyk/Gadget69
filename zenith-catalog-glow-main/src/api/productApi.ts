import apiClient from "./client";
import { Product } from "@/types";

export const getProducts = async (): Promise<Product[]> => {
  const res = await apiClient.get("/products");
  return res.data;
};

export const getProductById = async (id: number): Promise<Product> => {
  const res = await apiClient.get(`/products/${id}`);
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
