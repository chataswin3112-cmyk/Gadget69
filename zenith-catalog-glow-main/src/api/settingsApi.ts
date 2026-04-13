import apiClient from "./client";
import { StoreSettings } from "@/types";

export const getSettings = async (): Promise<StoreSettings> => {
  const res = await apiClient.get("/settings");
  return res.data;
};

export const getAdminSettings = async (): Promise<StoreSettings> => {
  const res = await apiClient.get("/admin/settings");
  return res.data;
};

export const updateSettings = async (data: Partial<StoreSettings>): Promise<StoreSettings> => {
  const res = await apiClient.put("/admin/settings", data);
  return res.data;
};
