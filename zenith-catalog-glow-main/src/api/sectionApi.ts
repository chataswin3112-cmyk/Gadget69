import apiClient from "./client";
import { Section } from "@/types";

export const getSections = async (): Promise<Section[]> => {
  const res = await apiClient.get("/sections");
  return res.data;
};

export const getAdminSections = async (): Promise<Section[]> => {
  const res = await apiClient.get("/admin/sections");
  return res.data;
};

export const createSection = async (data: Partial<Section>): Promise<Section> => {
  const res = await apiClient.post("/admin/sections", data);
  return res.data;
};

export const updateSection = async (id: number, data: Partial<Section>): Promise<Section> => {
  const res = await apiClient.put(`/admin/sections/${id}`, data);
  return res.data;
};

export const deleteSection = async (id: number): Promise<void> => {
  await apiClient.delete(`/admin/sections/${id}`);
};
