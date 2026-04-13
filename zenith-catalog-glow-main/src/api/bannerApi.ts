import apiClient from "./client";
import { Banner } from "@/types";

export const getBanners = async (): Promise<Banner[]> => {
  const res = await apiClient.get("/banners");
  return res.data;
};

export const getAdminBanners = async (): Promise<Banner[]> => {
  const res = await apiClient.get("/admin/banners");
  return res.data;
};

export const createBanner = async (data: Partial<Banner>): Promise<Banner> => {
  const res = await apiClient.post("/admin/banners", data);
  return res.data;
};

export const updateBanner = async (id: number, data: Partial<Banner>): Promise<Banner> => {
  const res = await apiClient.put(`/admin/banners/${id}`, data);
  return res.data;
};

export const deleteBanner = async (id: number): Promise<void> => {
  await apiClient.delete(`/admin/banners/${id}`);
};
